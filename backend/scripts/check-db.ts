import prisma from "../src/db/index.js"

async function checkDatabase() {
  try {
    console.log("📊 Checking database...\n")

    // Check Rooms table
    console.log("🏠 Rooms:")
    const rooms = await prisma.room.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })
    console.log(`Found ${rooms.length} rooms:`)
    rooms.forEach((room) => {
      console.log(`  - ${room.name} (${room.id})`)
      console.log(`    Host: ${room.host.username} (${room.host.email})`)
      console.log(`    Active: ${room.isActive}, Created: ${room.createdAt}`)
      console.log()
    })

    // Check FileShares table
    console.log("📁 File Shares:")
    const fileShares = await prisma.fileShare.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    console.log(`Found ${fileShares.length} file shares`)
    fileShares.forEach((share) => {
      console.log(`  - ${share.fileName} (${share.shareToken})`)
      console.log(`    Active: ${share.isActive}, Size: ${share.fileSize} bytes`)
      console.log()
    })

    // Check Users table
    console.log("👥 Users:")
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    })
    console.log(`Found ${users.length} users`)
    users.forEach((user) => {
      console.log(`  - ${user.username} (${user.email})`)
      console.log(`    ID: ${user.id}`)
      console.log()
    })

    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    console.log("✅ Database connection: OK")
  } catch (error) {
    console.error("❌ Database error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
