const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = bcrypt.hashSync('admin123', 10)

  // Upsert primary admin account
  await prisma.admin.upsert({
    where: { email: 'admin@phisiyo.com' },
    update: {},
    create: {
      email: 'admin@phisiyo.com',
      password: hashedPassword,
      name: 'Super Admin',
    },
  })
  console.log('Admin seeded: admin@phisiyo.com / admin123')

  // Upsert clinic-branded admin account (matches the UI placeholder)
  await prisma.admin.upsert({
    where: { email: 'admin@c-cure.com' },
    update: {},
    create: {
      email: 'admin@c-cure.com',
      password: hashedPassword,
      name: 'Dr. Sonatan Manna',
    },
  })
  console.log('Admin seeded: admin@c-cure.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

