import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../data/charging.db')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    totalSlots INTEGER NOT NULL DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER NOT NULL REFERENCES stations(id),
    serial_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'rented', 'offline'))
  );

  CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL REFERENCES devices(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    user_id TEXT NOT NULL,
    start_time TEXT NOT NULL DEFAULT (datetime('now')),
    end_time TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'returned', 'bought_out')),
    total_fee REAL
  );

  CREATE TABLE IF NOT EXISTS pricing_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'standard' CHECK(type IN ('standard', 'holiday')),
    hourly_rate REAL NOT NULL DEFAULT 2.0,
    buyout_price REAL NOT NULL DEFAULT 99.0,
    start_date TEXT,
    end_date TEXT,
    multiplier REAL NOT NULL DEFAULT 1.0
  );
`)

const stationCount = db.prepare('SELECT COUNT(*) as count FROM stations').get() as { count: number }

if (stationCount.count === 0) {
  const insertStation = db.prepare(
    'INSERT INTO stations (name, address, latitude, longitude, totalSlots) VALUES (?, ?, ?, ?, ?)'
  )
  const insertDevice = db.prepare(
    'INSERT INTO devices (station_id, serial_number, status) VALUES (?, ?, ?)'
  )

  const stations = [
    ['万达广场A区', '万达广场一楼大厅', 31.2304, 121.4737, 12],
    ['地铁南京东路站', '南京东路地铁站2号口', 31.2354, 121.4857, 8],
    ['星巴克南京路店', '南京东路步行街88号', 31.2360, 121.4820, 6],
    ['肯德基人民广场店', '人民广场地下商城B1', 31.2280, 121.4750, 10],
    ['全家便利店静安寺', '静安寺地铁站1号口', 31.2240, 121.4480, 8],
  ] as const

  const seedTransaction = db.transaction(() => {
    for (const [name, address, lat, lng, totalSlots] of stations) {
      const result = insertStation.run(name, address, lat, lng, totalSlots)
      const stationId = result.lastInsertRowid as number
      for (let i = 1; i <= totalSlots; i++) {
        insertDevice.run(stationId, `PB-${stationId}-${i}`, 'available')
      }
    }
  })

  seedTransaction()

  db.prepare(
    "INSERT INTO pricing_rules (name, type, hourly_rate, buyout_price, multiplier) VALUES (?, ?, ?, ?, ?)"
  ).run('标准费率', 'standard', 2.0, 99.0, 1.0)
}

export default db
