import { Router, type Request, type Response } from 'express'
import { getStationStats, getDevicesByStation } from '../services/deviceService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const stats = getStationStats()
    const camelCaseStats = stats.map((s: any) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      totalSlots: s.totalSlots,
      availableCount: s.availableCount,
      rentedCount: s.rentedCount,
      offlineCount: s.offlineCount,
    }))
    res.json({ success: true, data: camelCaseStats })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const station = (getStationStats() as any[]).find((s) => s.id === id)
    if (!station) {
      res.status(404).json({ success: false, error: '站点不存在' })
      return
    }
    const devices = getDevicesByStation(id)
    const camelCaseStation = {
      id: station.id,
      name: station.name,
      address: station.address,
      latitude: station.latitude,
      longitude: station.longitude,
      totalSlots: station.totalSlots,
      availableCount: station.availableCount,
      rentedCount: station.rentedCount,
      offlineCount: station.offlineCount,
      devices: devices.map((d: any) => ({
        id: d.id,
        stationId: d.station_id,
        serialNumber: d.serial_number,
        status: d.status,
      })),
    }
    res.json({ success: true, data: camelCaseStation })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router
