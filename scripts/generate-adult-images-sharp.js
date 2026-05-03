/**
 * Generate product images using sharp (SVG + gradient backgrounds)
 * Run with: node scripts/generate-adult-images-sharp.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'products')

// Color palettes for different product types
const colorPalettes = [
  { bg: '#1a1a2e', accent: '#e94560', text: '#ffffff' },  // Dark red
  { bg: '#16213e', accent: '#0f3460', text: '#ffffff' },  // Dark blue
  { bg: '#1a1a2e', accent: '#e94560', text: '#ffffff' },  // Purple-red
  { bg: '#0d1117', accent: '#ff6b6b', text: '#ffffff' },  // Dark with red
  { bg: '#1a1a2e', accent: '#f39c12', text: '#ffffff' },  // Dark with gold
  { bg: '#2d1b69', accent: '#e056a0', text: '#ffffff' },  // Purple-pink
  { bg: '#1b2838', accent: '#66c0f4', text: '#ffffff' },  // Steam blue
  { bg: '#1a0a2e', accent: '#ff6b9d', text: '#ffffff' },  // Dark pink
  { bg: '#0a1628', accent: '#00d2ff', text: '#ffffff' },  // Cyber blue
  { bg: '#1a0a0a', accent: '#ff4444', text: '#ffffff' },  // Dark red
  { bg: '#0d1117', accent: '#f97316', text: '#ffffff' },  // Dark orange
  { bg: '#1e1b4b', accent: '#a78bfa', text: '#ffffff' },  // Indigo
]

function getPalette(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colorPalettes[Math.abs(hash) % colorPalettes.length]
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

async function generateProductImage(product) {
  const palette = getPalette(product.name)
  const initials = getInitials(product.name)
  
  // Create SVG with gradient background, initials, and product name
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${palette.bg};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${palette.accent}33;stop-opacity:1" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="40%" r="50%">
        <stop offset="0%" style="stop-color:${palette.accent}22;stop-opacity:1" />
        <stop offset="100%" style="stop-color:${palette.accent}00;stop-opacity:1" />
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)" rx="0" />
    <rect width="1024" height="1024" fill="url(#glow)" />
    
    <!-- Decorative circles -->
    <circle cx="800" cy="200" r="150" fill="${palette.accent}08" />
    <circle cx="200" cy="800" r="100" fill="${palette.accent}06" />
    
    <!-- Accent line -->
    <rect x="412" y="340" width="200" height="4" rx="2" fill="${palette.accent}" opacity="0.8" />
    
    <!-- Initials circle -->
    <circle cx="512" cy="400" r="100" fill="${palette.accent}20" stroke="${palette.accent}" stroke-width="3" />
    <text x="512" y="420" text-anchor="middle" fill="${palette.text}" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="bold">${initials}</text>
    
    <!-- Accent line bottom -->
    <rect x="412" y="540" width="200" height="4" rx="2" fill="${palette.accent}" opacity="0.8" />
    
    <!-- Product name -->
    <text x="512" y="620" text-anchor="middle" fill="${palette.text}" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="bold" opacity="0.95">
      ${product.name.length > 22 ? product.name.substring(0, 20) + '...' : product.name}
    </text>
    
    <!-- PREMIUM badge -->
    <rect x="382" y="680" width="260" height="40" rx="20" fill="${palette.accent}" opacity="0.9" />
    <text x="512" y="708" text-anchor="middle" fill="${palette.text}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold">PREMIUM</text>
    
    <!-- Bottom tagline -->
    <text x="512" y="800" text-anchor="middle" fill="${palette.text}" font-family="Arial, Helvetica, sans-serif" font-size="18" opacity="0.5">Streaming Hub</text>
  </svg>`

  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()

  return buffer
}

async function main() {
  console.log('🎨 Generating adult product images with sharp...')
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const db = new PrismaClient()

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

      // Skip if custom image already exists (not category image)
      if (fs.existsSync(filepath)) {
        const currentImage = product.image || ''
        // Only skip if the file is not the category image placeholder
        if (!currentImage.startsWith('/images/categories/')) {
          console.log(`⏭️  Skipping ${product.name} (custom image exists)`)
          continue
        }
      }

      try {
        const buffer = await generateProductImage(product)
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
      }
    }

    console.log(`\n📊 Summary: ${successCount} generated, ${failCount} failed`)
  } finally {
    await db.$disconnect()
  }
}

main().catch(console.error)
