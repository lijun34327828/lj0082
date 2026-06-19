import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import stationRoutes from './routes/stations.js'
import rentalRoutes from './routes/rentals.js'
import pricingRoutes from './routes/pricing.js'
import deviceRoutes from './routes/devices.js'
import { startScheduler } from './scheduler.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/stations', stationRoutes)
app.use('/api/rentals', rentalRoutes)
app.use('/api/pricing', pricingRoutes)
app.use('/api/devices', deviceRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

startScheduler()

export default app
