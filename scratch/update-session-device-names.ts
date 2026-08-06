import prisma from '../src/lib/prisma'
import { parseDeviceInfo } from '../src/lib/device-parser'

async function updateDeviceNames() {
  console.log('Fetching active sessions from database...')
  const sessions = await prisma.activeSession.findMany({
    select: { id: true, userAgent: true, deviceType: true }
  })

  console.log(`Found ${sessions.length} sessions in DB. Updating device descriptions...`)

  for (const s of sessions) {
    if (s.userAgent) {
      const parsed = parseDeviceInfo(s.userAgent)
      console.log(`Session ${s.id}: "${s.deviceType}" => "${parsed.fullLabel}"`)
      await prisma.activeSession.update({
        where: { id: s.id },
        data: { deviceType: parsed.fullLabel }
      })
    }
  }

  console.log('Finished updating all database session device names!')
}

updateDeviceNames().catch(console.error).finally(() => prisma.$disconnect())
