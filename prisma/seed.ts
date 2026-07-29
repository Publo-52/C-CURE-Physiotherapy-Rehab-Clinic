const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const existingAdmin = await prisma.admin.findFirst()
  if (existingAdmin) {
    console.log('Admin already exists. Skipping seed.')
    return
  }

  const hashedPassword = bcrypt.hashSync('admin123', 10) // Default password

  await prisma.admin.create({
    data: {
      email: 'admin@phisiyo.com',
      password: hashedPassword,
      name: 'Super Admin',
    },
  })

  console.log('Admin user created: admin@phisiyo.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

