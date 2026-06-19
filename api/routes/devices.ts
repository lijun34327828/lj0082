import { Router, type Request, type Response } from 'express'
import { getDevicesByStation, getAvailableDevices } from '../services/deviceService.js'

const router = Router()

router.get('/station/:stationId', (req: Request, res: Response): void => {
  try {
    const stationId = Number(req.params.stationId)
    if (!stationId) {
      res.status(400).json({ success: false, error: '缺少站点ID' })
      return
    }
    const devices = getDevicesByStation(stationId)
    const camelCaseDevices = devices.map((d: any) => ({
      id: d.id,
      stationId: d.station_id,
      serialNumber: d.serial_number,
      status: d.status,
    }))
    res.json({ success: true, data: camelCaseDevices })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.get('/station/:stationId/available', (req: Request, res: Response): void => {
  try {
    const stationId = Number(req.params.stationId)
    if (!stationId) {
      res.status(400).json({ success: false, error: '缺少站点ID' })
      return
    }
    const devices = getAvailableDevices(stationId)
    const camelCaseDevices = devices.map((d: any) => ({
      id: d.id,
      stationId: d.station_id,
      serialNumber: d.serial_number,
      status: d.status,
    }))
    res.json({ success: true, data: camelCaseDevices })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router
