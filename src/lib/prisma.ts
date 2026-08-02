import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prismaClientSingleton = () => {
  let databaseUrl = process.env.DATABASE_URL

  // Check if we are running in Vercel (or any read-only/serverless environment)
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db'
    const bundledDbPath = path.join(process.cwd(), 'prisma', 'dev.db')

    // Copy bundled DB to /tmp if it doesn't exist yet in /tmp
    if (!fs.existsSync(tmpDbPath)) {
      try {
        if (fs.existsSync(bundledDbPath)) {
          // Ensure directory exists (though /tmp always exists, we make sure)
          fs.copyFileSync(bundledDbPath, tmpDbPath)
          console.log('Database copied to /tmp/dev.db successfully.')
        } else {
          console.warn('Bundled database not found at', bundledDbPath)
        }
      } catch (err) {
        console.error('Failed to copy database to /tmp:', err)
      }
    }
    databaseUrl = `file:${tmpDbPath}`
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

