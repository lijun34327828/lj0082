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

export function calculateFee(
  startTime: string,
  endTime: string,
  hourlyRate: number,
  multiplier: number,
  buyoutPrice: number
): { totalFee: number; isBuyout: boolean; billedHours: number } {
  const hours = calculateHours(startTime, endTime)

  if (hours > BUYOUT_THRESHOLD_HOURS) {
    return {
      totalFee: buyoutPrice * multiplier,
      isBuyout: true,
      billedHours: Math.ceil(hours * 100) / 100,
    }
  }

  const billedHours = Math.max(1, Math.ceil(hours))
  return {
    totalFee: billedHours * hourlyRate * multiplier,
    isBuyout: false,
    billedHours,
  }
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
  const standardRate = hourlyRate
  const holidayMultiplier = isHoliday ? multiplier : 1.0
  const appliedRate = hourlyRate * (isHoliday ? multiplier : 1.0)

  if (hours > BUYOUT_THRESHOLD_HOURS) {
    const finalBuyout = buyoutPrice * holidayMultiplier
    const baseBuyout = buyoutPrice
    return {
      fee: finalBuyout,
      isBuyout: true,
      breakdown: {
        baseFee: baseBuyout,
        holidaySurcharge: isHoliday ? finalBuyout - baseBuyout : 0,
        totalFee: finalBuyout,
      },
    }
  }

  const billedHours = Math.max(1, Math.ceil(hours))
  const baseFee = billedHours * standardRate
  const totalFee = billedHours * appliedRate
  return {
    fee: totalFee,
    isBuyout: false,
    breakdown: {
      baseFee,
      holidaySurcharge: isHoliday ? totalFee - baseFee : 0,
      totalFee,
    },
  }
}

export const BILLING_CONSTANTS = {
  BUYOUT_THRESHOLD_HOURS,
}
