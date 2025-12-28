const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Supabase Measurements ---')
    const users = await prisma.user.findMany({
        include: {
            measurements: true
        }
    })

    if (users.length === 0) {
        console.log('No users found in database.')
    } else {
        users.forEach(user => {
            console.log(`User: ${user.name} (${user.email})`)
            console.log(`Measurements: ${user.measurements.length}`)
            user.measurements.forEach((m, i) => {
                console.log(`  [${i + 1}] Length: ${m.thobeLength}cm, Chest: ${m.chest}cm, Created: ${m.createdAt}`)
            })
        })
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
