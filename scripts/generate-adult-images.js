/**
 * Image Generation Script for Adult Products
 * Run with: node scripts/generate-adult-images.js
 * 
 * This script generates AI product images for all adult products
 * using the z-ai-web-dev-sdk with proper rate limiting.
 */

const ZAI = require('z-ai-web-dev-sdk').default
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'products')
const DELAY_MS = 5000 // 5 seconds between each request

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  console.log('🎨 Starting adult product image generation...')
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const db = new PrismaClient()
  const zai = await ZAI.create()

  try {
    const products = await db.product.findMany({
      where: { category: { isAdult: true } },
      orderBy: { name: 'asc' }
    })

    console.log(`📦 Found ${products.length} adult products`)

    let successCount = 0
    let failCount = 0

    for (const product of products) {
      const filename = `${product.slug}.png`
      const filepath = path.join(OUTPUT_DIR, filename)

      // Skip if image already exists
      if (fs.existsSync(filepath)) {
        console.log(`⏭️  Skipping ${product.name} (image already exists)`)
        continue
      }

      const prompt = `Professional digital streaming service logo icon for ${product.name}, dark premium background with gradient accents, sleek modern design, app icon style, high quality, clean`

      try {
        console.log(`🎨 Generating: ${product.name}...`)
        
        const response = await zai.images.generations.create({
          prompt,
          size: '1024x1024'
        })

        const imageBase64 = response.data[0].base64
        const buffer = Buffer.from(imageBase64, 'base64')
        fs.writeFileSync(filepath, buffer)

        // Update database
        await db.product.update({
          where: { id: product.id },
          data: { image: `/images/products/${filename}` }
        })

        successCount++
        console.log(`✅ Generated: ${product.name}`)
      } catch (error) {
        failCount++
        console.error(`❌ Failed: ${product.name} - ${error.message}`)
        
        // If rate limited, wait longer
        if (error.message.includes('429')) {
          console.log('⏳ Rate limited, waiting 60 seconds...')
          await sleep(60000)
        }
      }

      // Delay between requests
      await sleep(DELAY_MS)
    }

    console.log(`\n📊 Summary: ${successCount} generated, ${failCount} failed`)
  } finally {
    await db.$disconnect()
  }
}

main().catch(console.error)
