import db from '../db.js'

export function getDevicesByStation(stationId: number): any[] {
  return db.prepare('SELECT * FROM devices WHERE station_id = ?').all(stationId)
}

export function getAvailableDevices(stationId: number): any[] {
  return db.prepare("SELECT * FROM devices WHERE station_id = ? AND status = 'available'").all(stationId)
}

export function getStationStats(): any[] {
  const stations = db.prepare('SELECT * FROM stations').all() as any[]
  return stations.map(station => {
    const available = db.prepare("SELECT COUNT(*) as count FROM devices WHERE station_id = ? AND status = 'available'").get(station.id) as { count: number }
    const rented = db.prepare("SELECT COUNT(*) as count FROM devices WHERE station_id = ? AND status = 'rented'").get(station.id) as { count: number }
    const offline = db.prepare("SELECT COUNT(*) as count FROM devices WHERE station_id = ? AND status = 'offline'").get(station.id) as { count: number }
    return {
      ...station,
      availableCount: available.count,
      rentedCount: rented.count,
      offlineCount: offline.count,
    }
  })
}

export function updateDeviceStatus(deviceId: number, status: string): void {
  db.prepare('UPDATE devices SET status = ? WHERE id = ?').run(status, deviceId)
}
