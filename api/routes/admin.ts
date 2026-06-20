import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/revenue', (req: Request, res: Response): void => {
  try {
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string
    const granularity = (req.query.granularity as string) || 'day'

    if (!startDate || !endDate) {
      res.status(400).json({ success: false, error: '缺少 startDate 或 endDate 参数' })
      return
    }

    const settledRentals = db.prepare(`
      SELECT
        r.id,
        r.station_id,
        r.start_time,
        r.end_time,
        r.status,
        r.total_fee,
        s.name AS station_name
      FROM rentals r
      JOIN stations s ON r.station_id = s.id
      WHERE r.status IN ('returned', 'bought_out')
        AND r.total_fee IS NOT NULL
        AND date(r.end_time) >= date(?)
        AND date(r.end_time) <= date(?)
      ORDER BY r.end_time ASC
    `).all(startDate, endDate) as Array<{
      id: number
      station_id: number
      start_time: string
      end_time: string
      status: string
      total_fee: number
      station_name: string
    }>

    if (settledRentals.length === 0) {
      res.json({
        success: true,
        data: {
          dailyData: [],
          summary: {
            totalOrders: 0,
            totalRevenue: 0,
            avgDailyRevenue: 0,
            buyoutRate: 0,
            avgRentHours: 0,
          },
          stationRanking: [],
        },
      })
      return
    }

    const dailyMap = new Map<string, { revenue: number; orders: number }>()

    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = getDateKey(d, granularity)
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { revenue: 0, orders: 0 })
      }
    }

    const stationMap = new Map<string, { orderCount: number; revenue: number; buyoutCount: number; totalHours: number }>()

    let totalRevenue = 0
    const totalOrders = settledRentals.length
    let buyoutCount = 0
    let totalRentHours = 0

    for (const rental of settledRentals) {
      const key = getDateKey(new Date(rental.end_time + 'Z'), granularity)
      const entry = dailyMap.get(key)
      if (entry) {
        entry.revenue += rental.total_fee
        entry.orders += 1
      }

      totalRevenue += rental.total_fee
      if (rental.status === 'bought_out') buyoutCount++

      const startMs = new Date(rental.start_time + 'Z').getTime()
      const endMs = new Date(rental.end_time + 'Z').getTime()
      totalRentHours += (endMs - startMs) / (1000 * 60 * 60)

      const station = stationMap.get(rental.station_name)
      if (station) {
        station.orderCount += 1
        station.revenue += rental.total_fee
        if (rental.status === 'bought_out') station.buyoutCount += 1
        station.totalHours += (endMs - startMs) / (1000 * 60 * 60)
      } else {
        stationMap.set(rental.station_name, {
          orderCount: 1,
          revenue: rental.total_fee,
          buyoutCount: rental.status === 'bought_out' ? 1 : 0,
          totalHours: (endMs - startMs) / (1000 * 60 * 60),
        })
      }
    }

    const dailyData: Array<{ date: string; revenue: number }> = []
    const sortedKeys = Array.from(dailyMap.keys()).sort()
    for (const key of sortedKeys) {
      const entry = dailyMap.get(key)!
      dailyData.push({ date: key, revenue: Math.round(entry.revenue * 100) / 100 })
    }

    const daySpan = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const effectiveDays = granularity === 'week'
      ? Math.ceil(daySpan / 7)
      : granularity === 'month'
        ? countMonths(start, end)
        : daySpan

    const summary = {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgDailyRevenue: Math.round((totalRevenue / effectiveDays) * 100) / 100,
      buyoutRate: Math.round((buyoutCount / totalOrders) * 10000) / 100,
      avgRentHours: Math.round((totalRentHours / totalOrders) * 100) / 100,
    }

    const stationRanking = Array.from(stationMap.entries())
      .map(([stationName, data]) => ({
        stationName,
        orderCount: data.orderCount,
        revenue: Math.round(data.revenue * 100) / 100,
        buyoutCount: data.buyoutCount,
        avgHours: Math.round((data.totalHours / data.orderCount) * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    res.json({
      success: true,
      data: { dailyData, summary, stationRanking },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ success: false, error: message })
  }
})

function getDateKey(date: Date, granularity: string): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  if (granularity === 'month') {
    return `${y}-${m}-01`
  }
  if (granularity === 'week') {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date.getFullYear(), date.getMonth(), diff)
    const my = monday.getFullYear()
    const mm = String(monday.getMonth() + 1).padStart(2, '0')
    const md = String(monday.getDate()).padStart(2, '0')
    return `${my}-${mm}-${md}`
  }
  return `${y}-${m}-${d}`
}

function countMonths(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
}

export default router
