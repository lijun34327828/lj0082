import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { simulateBilling, getApplicableRule } from '../services/billingService.js'

const router = Router()

function toCamelRule(r: any): any {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    hourlyRate: r.hourly_rate,
    buyoutPrice: r.buyout_price,
    startDate: r.start_date,
    endDate: r.end_date,
    multiplier: r.multiplier,
  }
}

router.get('/rules', (req: Request, res: Response): void => {
  try {
    const rules = db.prepare('SELECT * FROM pricing_rules ORDER BY type DESC, id ASC').all()
    res.json({ success: true, data: rules.map(toCamelRule) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.get('/rules/applicable', (req: Request, res: Response): void => {
  try {
    const date = req.query.date as string | undefined
    const rule = getApplicableRule(date)
    res.json({ success: true, data: rule ? toCamelRule(rule) : null })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/rules', (req: Request, res: Response): void => {
  try {
    const { name, type, hourlyRate, buyoutPrice, startDate, endDate, multiplier } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '缺少规则名称' })
      return
    }
    if (type === 'holiday' && (!startDate || !endDate)) {
      res.status(400).json({ success: false, error: '节假日规则需要指定开始和结束日期' })
      return
    }
    const result = db
      .prepare(
        'INSERT INTO pricing_rules (name, type, hourly_rate, buyout_price, start_date, end_date, multiplier) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        name,
        type || 'standard',
        hourlyRate ?? 2.0,
        buyoutPrice ?? 99.0,
        startDate || null,
        endDate || null,
        multiplier ?? 1.0
      )
    const rule = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: toCamelRule(rule) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.put('/rules/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const existing = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '规则不存在' })
      return
    }
    const { name, type, hourlyRate, buyoutPrice, startDate, endDate, multiplier } = req.body
    db.prepare(
      'UPDATE pricing_rules SET name = ?, type = ?, hourly_rate = ?, buyout_price = ?, start_date = ?, end_date = ?, multiplier = ? WHERE id = ?'
    ).run(
      name || existing.name,
      type || existing.type,
      hourlyRate ?? existing.hourly_rate,
      buyoutPrice ?? existing.buyout_price,
      startDate ?? existing.start_date,
      endDate ?? existing.end_date,
      multiplier ?? existing.multiplier,
      id
    )
    const rule = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(id)
    res.json({ success: true, data: toCamelRule(rule) })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.delete('/rules/:id', (req: Request, res: Response): void => {
  try {
    const id = Number(req.params.id)
    const existing = db.prepare('SELECT * FROM pricing_rules WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '规则不存在' })
      return
    }
    const existingAny = existing as any
    if (existingAny.type === 'standard') {
      const standardCount = db
        .prepare("SELECT COUNT(*) as count FROM pricing_rules WHERE type = 'standard'")
        .get() as { count: number }
      if (standardCount.count <= 1) {
        res.status(400).json({ success: false, error: '至少需要保留一条标准规则' })
        return
      }
    }
    db.prepare('DELETE FROM pricing_rules WHERE id = ?').run(id)
    res.json({ success: true, message: '删除成功' })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

router.post('/simulate', (req: Request, res: Response): void => {
  try {
    const { hours, isHoliday, hourlyRate, buyoutPrice, multiplier } = req.body
    if (hours === undefined || hours === null) {
      res.status(400).json({ success: false, error: '缺少使用时长' })
      return
    }
    const result = simulateBilling(
      Number(hours),
      Boolean(isHoliday),
      Number(hourlyRate) || 2.0,
      Number(buyoutPrice) || 99.0,
      Number(multiplier) || 1.0
    )
    res.json({
      success: true,
      data: {
        rentalFee: result.breakdown.baseFee,
        buyoutTriggered: result.isBuyout,
        finalFee: result.breakdown.totalFee,
        breakdown: result.breakdown,
      },
    })
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router
