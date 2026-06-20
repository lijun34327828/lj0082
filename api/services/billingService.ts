import db from '../db.js'

const BUYOUT_THRESHOLD_HOURS = 24

function normalizeUtc(dt: string): string {
  if (dt.includes('T')) {
    if (dt.endsWith('Z')) return dt
    return dt + 'Z'
  }
  return dt.replace(' ', 'T') + 'Z'
}

export function calculateHours(startTime: string, endTime: string): number {
  const start = new Date(normalizeUtc(startTime)).getTime()
  const end = new Date(normalizeUtc(endTime)).getTime()
  return (end - start) / (1000 * 60 * 60)
}

export function getApplicableRule(date?: string): any {
  const targetDate = date || new Date().toISOString().slice(0, 10)
  const holidayRule = db
    .prepare(
      "SELECT * FROM pricing_rules WHERE type = 'holiday' AND start_date <= ? AND end_date >= ?"
    )
    .get(targetDate, targetDate) as any
  if (holidayRule) return holidayRule
  return db.prepare("SELECT * FROM pricing_rules WHERE type = 'standard' LIMIT 1").get() as any
}

function getRuleForHour(dateStr: string, standardRule: any, holidayRules: any[]): any {
  const datePart = dateStr.slice(0, 10)
  const holidayRule = holidayRules.find(
    (r) => r.start_date <= datePart && r.end_date >= datePart
  )
  return holidayRule || standardRule
}

interface RuleSet {
  standardRule: any
  holidayRules: any[]
}

function getAllRules(): RuleSet {
  const standardRule = db.prepare("SELECT * FROM pricing_rules WHERE type = 'standard' LIMIT 1").get() as any
  if (!standardRule) {
    throw new Error('未找到标准计费规则，请先在管理后台配置')
  }
  const holidayRules = db.prepare("SELECT * FROM pricing_rules WHERE type = 'holiday'").all() as any[]
  return { standardRule, holidayRules }
}

interface CalculateFeeOptions {
  hourlyRate?: number
  buyoutPrice?: number
  rules?: RuleSet
  forceMultiplier?: number
}

export function calculateFee(
  startTime: string,
  endTime: string,
  options: CalculateFeeOptions = {}
): { totalFee: number; isBuyout: boolean; billedHours: number; baseFee: number; holidaySurcharge: number } {
  const hours = calculateHours(startTime, endTime)
  const { standardRule, holidayRules } = options.rules || getAllRules()

  if (hours > BUYOUT_THRESHOLD_HOURS) {
    const endRule = getRuleForHour(endTime, standardRule, holidayRules)
    const buyoutPrice = options.buyoutPrice ?? standardRule.buyout_price
    const multiplier = options.forceMultiplier ?? endRule.multiplier
    const isHoliday = endRule.type === 'holiday'
    const finalBuyout = buyoutPrice * multiplier
    const baseBuyout = buyoutPrice
    return {
      totalFee: finalBuyout,
      isBuyout: true,
      billedHours: Math.ceil(hours * 100) / 100,
      baseFee: baseBuyout,
      holidaySurcharge: isHoliday ? finalBuyout - baseBuyout : 0,
    }
  }

  const billedHours = Math.max(1, Math.ceil(hours))
  const start = new Date(normalizeUtc(startTime))
  let baseFee = 0
  let totalFee = 0

  for (let i = 0; i < billedHours; i++) {
    const hourDate = new Date(start.getTime() + i * 60 * 60 * 1000)
    const hourDateStr = hourDate.toISOString()
    const rule = getRuleForHour(hourDateStr, standardRule, holidayRules)
    const hourlyRate = options.hourlyRate ?? standardRule.hourly_rate
    const multiplier = options.forceMultiplier ?? rule.multiplier
    baseFee += hourlyRate
    totalFee += hourlyRate * multiplier
  }

  return {
    totalFee,
    isBuyout: false,
    billedHours,
    baseFee,
    holidaySurcharge: totalFee - baseFee,
  }
}

export function simulateBilling(
  hours: number,
  isHoliday: boolean,
  hourlyRate: number,
  buyoutPrice: number,
  multiplier: number
): {
  fee: number
  isBuyout: boolean
  breakdown: { baseFee: number; holidaySurcharge: number; totalFee: number }
} {
  const endTime = new Date().toISOString()
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

  const standardRule = { hourly_rate: hourlyRate, buyout_price: buyoutPrice, type: 'standard', multiplier: 1.0 }
  const holidayRule = { hourly_rate: hourlyRate, buyout_price: buyoutPrice, type: 'holiday', multiplier, start_date: '2000-01-01', end_date: '2099-12-31' }

  const rules: RuleSet = {
    standardRule,
    holidayRules: isHoliday ? [holidayRule] : [],
  }

  const result = calculateFee(startTime, endTime, { hourlyRate, buyoutPrice, rules })
  return {
    fee: result.totalFee,
    isBuyout: result.isBuyout,
    breakdown: {
      baseFee: result.baseFee,
      holidaySurcharge: result.holidaySurcharge,
      totalFee: result.totalFee,
    },
  }
}

export const BILLING_CONSTANTS = {
  BUYOUT_THRESHOLD_HOURS,
}
