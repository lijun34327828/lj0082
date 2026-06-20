import db from '../db.js'
import { calculateFee, getApplicableRule, calculateHours, BILLING_CONSTANTS } from './billingService.js'
import { updateDeviceStatus } from './deviceService.js'

export function createRental(stationId: number, deviceId: number, userId: string): any {
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as any
  if (!device) {
    throw new Error('设备不存在')
  }
  if (device.status !== 'available') {
    throw new Error('设备不可用，请选择其他设备')
  }

  const activeRental = db
    .prepare("SELECT * FROM rentals WHERE device_id = ? AND status = 'active'")
    .get(deviceId)
  if (activeRental) {
    throw new Error('该设备正在使用中，无法重复租借')
  }

  const rental = db.transaction(() => {
    updateDeviceStatus(deviceId, 'rented')
    const result = db
      .prepare(
        'INSERT INTO rentals (device_id, station_id, user_id, status) VALUES (?, ?, ?, ?)'
      )
      .run(deviceId, stationId, userId, 'active')
    return db.prepare('SELECT * FROM rentals WHERE id = ?').get(result.lastInsertRowid)
  })()

  return rental
}

export function returnRental(rentalId: number, returnStationId: number): any {
  const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId) as any
  if (!rental) {
    throw new Error('租赁记录不存在')
  }
  if (rental.status !== 'active' && rental.status !== 'bought_out') {
    throw new Error('该租赁已结束，无法重复归还')
  }

  const now = new Date().toISOString()
  const calcResult = calculateFee(rental.start_time, now)

  const finalStatus = calcResult.isBuyout ? 'bought_out' : 'returned'

  const result = db.transaction(() => {
    updateDeviceStatus(rental.device_id, 'available')
    db.prepare(
      'UPDATE rentals SET end_time = ?, status = ?, total_fee = ? WHERE id = ?'
    ).run(now, finalStatus, calcResult.totalFee, rentalId)
    return db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId) as any
  })()

  return {
    ...(result as Record<string, any>),
    isBuyout: calcResult.isBuyout,
    billedHours: calcResult.billedHours,
  }
}

export function getActiveRentals(userId?: string): any[] {
  if (userId) {
    return db
      .prepare(
        "SELECT r.*, d.serial_number as deviceSerial, s.name as station_name FROM rentals r JOIN devices d ON r.device_id = d.id JOIN stations s ON r.station_id = s.id WHERE r.status = 'active' AND r.user_id = ? ORDER BY r.start_time DESC"
      )
      .all(userId)
  }
  return db
    .prepare(
      "SELECT r.*, d.serial_number as deviceSerial, s.name as station_name FROM rentals r JOIN devices d ON r.device_id = d.id JOIN stations s ON r.station_id = s.id WHERE r.status = 'active' ORDER BY r.start_time DESC"
    )
    .all()
}

export function getRentalHistory(userId?: string): any[] {
  if (userId) {
    return db
      .prepare(
        "SELECT r.*, d.serial_number as deviceSerial, s.name as station_name FROM rentals r JOIN devices d ON r.device_id = d.id JOIN stations s ON r.station_id = s.id WHERE r.status IN ('returned', 'bought_out') AND r.user_id = ? ORDER BY r.end_time DESC"
      )
      .all(userId)
  }
  return db
    .prepare(
      "SELECT r.*, d.serial_number as deviceSerial, s.name as station_name FROM rentals r JOIN devices d ON r.device_id = d.id JOIN stations s ON r.station_id = s.id WHERE r.status IN ('returned', 'bought_out') ORDER BY r.end_time DESC"
    )
    .all()
}

export function getUnreturnedRentals(hoursThreshold: number = 24): any[] {
  const rentals = db
    .prepare(
      `SELECT r.*, d.serial_number as deviceSerial, s.name as station_name 
       FROM rentals r 
       JOIN devices d ON r.device_id = d.id 
       JOIN stations s ON r.station_id = s.id 
       WHERE r.status = 'active' 
       AND r.start_time < datetime('now', ?)
       ORDER BY r.start_time ASC`
    )
    .all(`-${hoursThreshold} hours`) as any[]

  return rentals.map((r) => {
    const now = new Date().toISOString()
    const hours = calculateHours(r.start_time, now)
    const calcResult = calculateFee(r.start_time, now)
    return {
      ...r,
      currentFee: calcResult.totalFee,
      currentHours: Math.round(hours * 100) / 100,
      isBuyoutPending: hours > BILLING_CONSTANTS.BUYOUT_THRESHOLD_HOURS,
    }
  })
}

export function getCurrentFee(rentalId: number): any {
  const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId) as any
  if (!rental) {
    throw new Error('租赁记录不存在')
  }
  if (rental.status !== 'active') {
    throw new Error('该租赁已结束')
  }

  const now = new Date().toISOString()
  const rule = getApplicableRule()
  const hours = calculateHours(rental.start_time, now)
  const calcResult = calculateFee(rental.start_time, now)

  return {
    rentalId: rental.id,
    currentFee: calcResult.totalFee,
    isBuyout: calcResult.isBuyout,
    hours: Math.round(hours * 100) / 100,
    billedHours: calcResult.billedHours,
    hourlyRate: rule.hourly_rate,
    multiplier: rule.multiplier,
    buyoutPrice: rule.buyout_price,
    buyoutThreshold: BILLING_CONSTANTS.BUYOUT_THRESHOLD_HOURS,
  }
}
