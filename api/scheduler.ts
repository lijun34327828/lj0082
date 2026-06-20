import cron from 'node-cron'
import db from './db.js'
import { BILLING_CONSTANTS } from './services/billingService.js'

export function startScheduler(): void {
  console.log(
    `[scheduler] 超时监控任务已启动，每 5 分钟检查超过 ${BILLING_CONSTANTS.BUYOUT_THRESHOLD_HOURS} 小时未归还的设备`
  )

  cron.schedule('*/5 * * * *', () => {
    try {
      const unreturned = db
        .prepare(
          `SELECT r.* 
           FROM rentals r 
           JOIN devices d ON r.device_id = d.id 
           WHERE r.status = 'active' 
           AND r.start_time < datetime('now', ?)`
        )
        .all(`-${BILLING_CONSTANTS.BUYOUT_THRESHOLD_HOURS} hours`) as any[]

      if (unreturned.length === 0) return

      console.log(
        `[scheduler] ${new Date().toISOString()} - 发现 ${unreturned.length} 条超时租赁记录，等待用户归还时自动按买断结算`
      )
    } catch (e: any) {
      console.error('[scheduler] 超时监控任务执行失败:', e.message)
    }
  })
}
