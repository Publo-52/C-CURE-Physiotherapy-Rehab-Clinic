require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Permanently delete legacy admin accounts
  const deleted = await prisma.admin.deleteMany({
    where: {
      email: {
        in: ['admin@phisiyo.com', 'admin@c-cure.com'],
      },
    },
  })
  console.log(`Permanently removed ${deleted.count} legacy account(s): admin@phisiyo.com, admin@c-cure.com`)

  const adminPassword = bcrypt.hashSync('manna@#$4321S', 10)
  const superAdminPassword = bcrypt.hashSync('phisiyo123ADMIN@$', 10)

  // 1. Admin account (Max 3 devices limit)
  await prisma.admin.upsert({
    where: { email: 'sanatan54@gmail.com' },
    update: {
      password: adminPassword,
      role: 'Admin',
      name: 'Sanatan Manna',
    },
    create: {
      email: 'sanatan54@gmail.com',
      password: adminPassword,
      name: 'Sanatan Manna',
      role: 'Admin',
    },
  })
  console.log('Admin verified: sanatan54@gmail.com')

  // 2. Super Admin account (Unlimited devices)
  await prisma.admin.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: {
      password: superAdminPassword,
      role: 'Super Admin',
      name: 'Super Admin',
    },
    create: {
      email: 'superadmin@gmail.com',
      password: superAdminPassword,
      name: 'Super Admin',
      role: 'Super Admin',
    },
  })
  console.log('Super Admin verified: superadmin@gmail.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
