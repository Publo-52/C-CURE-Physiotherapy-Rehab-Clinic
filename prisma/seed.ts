const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
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
  console.log('Admin seeded: sanatan54@gmail.com')

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
  console.log('Super Admin seeded: superadmin@gmail.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
