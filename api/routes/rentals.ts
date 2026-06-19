import { Router, type Request, type Response } from 'express'
import {
  createRental,
  returnRental,
  getActiveRentals,
  getRentalHistory,
  getUnreturnedRentals,
  getCurrentFee,
} from '../services/rentalService.js'

const router = Router()

function toCamelRental(r: any): any {
  return {
    id: r.id,
    deviceId: r.device_id,
    stationId: r.station_id,
    userId: r.user_id,
    startTime: r.start_time,
    endTime: r.end_time,
    status: r.status,
    totalFee: r.total_fee,
    stationName: r.station_name,
    deviceSerial: r.deviceSerial,
    currentFee: r.currentFee,
    currentHours: r.currentHours,
    isBuyoutPending: r.isBuyoutPending,
    isBuyout: r.isBuyout,
    billedHours: r.billedHours,
  }
}

router.post('/', (req: Request, res: Response): void => {
  try {
    const { stationId, deviceId, userId } = req.body
    if (!stationId || !deviceId || !userId) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }
    const rental = createRental(Number(stationId), Number(deviceId), userId)
    res.status(201).json({ success: true, data: toCamelRental(rental) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/:id/return', (req: Request, res: Response): void => {
  try {
    const rentalId = Number(req.params.id)
    const { returnStationId } = req.body
    if (!returnStationId) {
      res.status(400).json({ success: false, error: '缺少归还站点ID' })
      return
    }
    const result = returnRental(rentalId, Number(returnStationId))
    res.json({ success: true, data: toCamelRental(result) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.get('/active', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string | undefined
    const rentals = getActiveRentals(userId)
    res.json({ success: true, data: rentals.map(toCamelRental) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.get('/history', (req: Request, res: Response): void => {
  try {
    const userId = req.query.userId as string | undefined
    const rentals = getRentalHistory(userId)
    res.json({ success: true, data: rentals.map(toCamelRental) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.get('/unreturned', (req: Request, res: Response): void => {
  try {
    const threshold = Number(req.query.hours) || 24
    const rentals = getUnreturnedRentals(threshold)
    res.json({ success: true, data: rentals.map(toCamelRental) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.get('/:id/current-fee', (req: Request, res: Response): void => {
  try {
    const rentalId = Number(req.params.id)
    const feeInfo = getCurrentFee(rentalId)
    res.json({ success: true, data: feeInfo })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router
