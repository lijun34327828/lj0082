import cron from 'node-cron'
import db from './db.js'
import { BILLING_CONSTANTS } from './services/billingService.js'

export function startScheduler(): void {
  console.log(
    `[scheduler] 自动买断任务已启动，每 5 分钟检查超过 ${BILLING_CONSTANTS.BUYOUT_THRESHOLD_HOURS} 小时未归还的设备`
  )

  cron.schedule('*/5 * * * *', () => {
    try {
      const unreturned = db
        .prepare(
          `SELECT r.*, p.hourly_rate, p.buyout_price, p.multiplier 
           FROM rentals r 
           JOIN devices d ON r.device_id = d.id 
           JOIN pricing_rules p ON p.type = 'standard' 
           WHERE r.status = 'active' 
           AND r.start_time < datetime('now', ?)
           AND p.id = (SELECT id FROM pricing_rules WHERE type = 'standard' LIMIT 1)`
        )
        .all(`-${BILLING_CONSTANTS.BUYOUT_THRESHOLD_HOURS} hours`) as any[]

      if (unreturned.length === 0) return

      const updateRental = db.prepare(
        'UPDATE rentals SET status = ?, total_fee = ?, end_time = ? WHERE id = ?'
      )
      const updateDevice = db.prepare("UPDATE devices SET status = 'available' WHERE id = ?")

      const buyoutTransaction = db.transaction(() => {
        for (const rental of unreturned) {
          const buyoutFee = rental.buyout_price * rental.multiplier
          const now = new Date().toISOString()
          updateRental.run('bought_out', buyoutFee, now, rental.id)
          updateDevice.run(rental.device_id)
        }
      })

      buyoutTransaction()
      console.log(
        `[scheduler] ${new Date().toISOString()} - 已自动买断 ${unreturned.length} 条超时租赁记录`
      )
    } catch (e: any) {
      console.error('[scheduler] 自动买断任务执行失败:', e.message)
    }
  })
}
