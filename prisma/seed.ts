import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const EXCHANGE_RATE = 0.056

function toRMB(bdt: number): string {
  return (bdt * EXCHANGE_RATE).toFixed(2)
}

async function main() {
  // Clear existing data
  await prisma.order.deleteMany()
  await prisma.banner.deleteMany()
  await prisma.review.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.settings.deleteMany()

  // Settings
  await prisma.settings.createMany({
    data: [
      { key: 'exchangeRate', value: '0.056' },
      { key: 'whatsappNumber', value: '+8801647236359' },
      { key: 'paymentNumber', value: '+8801647236359' },
      { key: 'paymentMethods', value: 'bKash, Nagad' },
      { key: 'siteName', value: 'Subscription Lagbe' },
      { key: 'tagline', value: 'Streaming Hub – Boost Hub' },
      { key: 'brandCopy', value: 'Welcome to Subscription Lagbe – your go-to solution for hassle-free OTT subscriptions. We provide easy access to movies, web series, AI tools, educational platforms, premium apps, VPNs, gaming top-ups, and digital services at affordable prices.' },
      { key: 'adminPassword', value: 'admin123' },
    ]
  })

  // Banners
  await prisma.banner.createMany({
    data: [
      { text: 'Fast delivery in 5–20 minutes | Payment First | WhatsApp Order Available', isActive: true },
    ]
  })

  // Categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Streaming / OTT', slug: 'streaming', icon: 'Tv', description: 'Netflix, YouTube Premium, Amazon Prime Video and more streaming subscriptions', isAdult: false, order: 1 } }),
    prisma.category.create({ data: { name: 'AI Tools', slug: 'ai-tools', icon: 'Brain', description: 'Gemini AI, Perplexity, Jarvis, Midjourney and more AI tool subscriptions', isAdult: false, order: 2 } }),
    prisma.category.create({ data: { name: 'Educational', slug: 'educational', icon: 'GraduationCap', description: 'Coursera, Grammarly, Skillshare and more educational subscriptions', isAdult: false, order: 3 } }),
    prisma.category.create({ data: { name: 'Design & Creative', slug: 'design-creative', icon: 'Palette', description: 'Adobe CC, Canva Pro, Figma and more design tool subscriptions', isAdult: false, order: 4 } }),
    prisma.category.create({ data: { name: 'Productivity / Business', slug: 'productivity', icon: 'Briefcase', description: 'Microsoft Office 365, Zoom Pro, TradingView and more productivity tools', isAdult: false, order: 5 } }),
    prisma.category.create({ data: { name: 'Cloud / Storage', slug: 'cloud-storage', icon: 'Cloud', description: 'Google One, TeraBox, MEGA cloud storage subscriptions', isAdult: false, order: 6 } }),
    prisma.category.create({ data: { name: 'VPN', slug: 'vpn', icon: 'Shield', description: 'NordVPN, ExpressVPN, Proton VPN and more VPN subscriptions', isAdult: false, order: 7 } }),
    prisma.category.create({ data: { name: 'Gift Cards / Apple', slug: 'gift-cards', icon: 'Gift', description: 'iTunes Gift Cards, Apple subscriptions and more', isAdult: false, order: 8 } }),
    prisma.category.create({ data: { name: 'Gaming TopUp', slug: 'gaming-topup', icon: 'Gamepad2', description: 'Free Fire, PUBG, Clash of Clans and more gaming top-ups', isAdult: false, order: 9 } }),
    prisma.category.create({ data: { name: 'Multi Collection', slug: 'multi-collection', icon: 'Layers', description: 'Viu, Scribd, Remini, Freepik and more multi-collection products', isAdult: false, order: 10 } }),
    prisma.category.create({ data: { name: 'Adult 18+', slug: 'adult', icon: 'AlertTriangle', description: 'Adult content subscriptions', isAdult: true, order: 11 } }),
  ])

  const [streaming, aiTools, educational, designCreative, productivity, cloudStorage, vpn, giftCards, gamingTopup, multiCollection, adult] = categories

  // Helper to create product
  const createProduct = (data: {
    name: string
    slug: string
    description: string
    categoryId: string
    image?: string
    basePriceBDT: string
    priceOptions?: Array<{ label: string; priceBDT: string; priceRMB: string }>
    duration?: string
    accountType?: string
    region?: string
    warranty?: string
    deliveryTime?: string
    stockStatus?: string
    isFeatured?: boolean
    isBestSeller?: boolean
    isNewArrival?: boolean
    features?: string[]
    order?: number
  }) => {
    return prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        image: data.image || null,
        basePriceBDT: data.basePriceBDT,
        priceOptions: JSON.stringify(data.priceOptions || []),
        duration: data.duration || null,
        accountType: data.accountType || null,
        region: data.region || null,
        warranty: data.warranty || null,
        deliveryTime: data.deliveryTime || '5-20 minutes',
        stockStatus: data.stockStatus || 'Available',
        isFeatured: data.isFeatured || false,
        isBestSeller: data.isBestSeller || false,
        isNewArrival: data.isNewArrival || false,
        features: JSON.stringify(data.features || []),
        order: data.order || 0,
      }
    })
  }

  // ============ STREAMING / OTT ============
  await createProduct({
    name: 'Netflix',
    slug: 'netflix',
    description: 'Netflix subscription purchase. Personal profile, PIN lock, 1 month to 12 months available. Watch unlimited movies, TV shows, and web series on all devices.',
    categoryId: streaming.id,
    basePriceBDT: '280',
    priceOptions: [
      { label: '1 Month', priceBDT: '280', priceRMB: toRMB(280) },
      { label: '3 Months', priceBDT: '750', priceRMB: toRMB(750) },
      { label: '6 Months', priceBDT: '1400', priceRMB: toRMB(1400) },
      { label: '12 Months', priceBDT: '2500', priceRMB: toRMB(2500) },
    ],
    duration: '1-12 Months',
    accountType: 'Personal / Shared',
    region: 'Bangladesh',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    isBestSeller: true,
    features: ['Personal Profile', 'PIN Lock', '4K Streaming', 'Multiple Devices', 'Download Available'],
    order: 1,
  })

  await createProduct({
    name: 'YouTube Premium',
    slug: 'youtube-premium',
    description: 'Bangladesh account, no VPN needed, full account on your mail. Enjoy ad-free videos, background play, and YouTube Music Premium.',
    categoryId: streaming.id,
    basePriceBDT: '150',
    priceOptions: [
      { label: '1 Month', priceBDT: '150', priceRMB: toRMB(150) },
      { label: '6 Months', priceBDT: '500', priceRMB: toRMB(500) },
    ],
    duration: '1-6 Months',
    accountType: 'Personal / Own Mail',
    region: 'Bangladesh',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    isBestSeller: true,
    features: ['Ad-Free Videos', 'Background Play', 'YouTube Music Premium', 'No VPN Needed', 'Bangladesh Account'],
    order: 2,
  })

  await createProduct({
    name: 'Amazon Prime Video',
    slug: 'amazon-prime-video',
    description: '1 month full personal account, mail/number ছাড়াও নিতে পারবেন, stable account, unlimited stock. Stream movies, TV shows, and Amazon Originals.',
    categoryId: streaming.id,
    basePriceBDT: '150',
    priceOptions: [
      { label: '1 Month', priceBDT: '150', priceRMB: toRMB(150) },
    ],
    duration: '1 Month',
    accountType: 'Personal / Full Account',
    region: 'Global',
    warranty: '1 Month Warranty',
    isFeatured: true,
    isBestSeller: true,
    features: ['Full Personal Account', 'Stable Account', 'Unlimited Stock', 'Amazon Originals', '4K UHD'],
    order: 3,
  })

  await createProduct({
    name: 'Sony LIV',
    slug: 'sony-liv',
    description: 'Bangladesh region, personal profile, renewable, warranty, delivery in 10 minutes, no VPN needed. Watch Sony TV channels, sports, and originals.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-12 Months',
    accountType: 'Personal',
    region: 'Bangladesh',
    warranty: 'Full Period Warranty',
    features: ['Bangladesh Region', 'Personal Profile', 'Renewable', 'No VPN Needed', 'Fast Delivery'],
    order: 4,
  })

  await createProduct({
    name: 'Hotstar',
    slug: 'hotstar',
    description: 'HOTSTAR 4K 1–12 Month, personal profile, OTP login, iOS/Android/PC/TV, live sports and movies.',
    categoryId: streaming.id,
    basePriceBDT: '190',
    priceOptions: [
      { label: '1 Month', priceBDT: '190', priceRMB: toRMB(190) },
    ],
    duration: '1-12 Months',
    accountType: 'Personal / OTP Login',
    region: 'India',
    warranty: 'Full Period Warranty',
    features: ['4K Quality', 'Personal Profile', 'OTP Login', 'All Platforms', 'Live Sports & Movies'],
    order: 5,
  })

  await createProduct({
    name: 'Crunchyroll',
    slug: 'crunchyroll',
    description: 'Crunchyroll Mega Fan Plan, monthly, other packs possible. Watch anime with simulcast and ad-free viewing.',
    categoryId: streaming.id,
    basePriceBDT: '200',
    priceOptions: [
      { label: '1 Month Mega Fan', priceBDT: '200', priceRMB: toRMB(200) },
    ],
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    isFeatured: true,
    features: ['Mega Fan Plan', 'Ad-Free Anime', 'Simulcast', 'Offline Viewing', 'Multiple Packs'],
    order: 6,
  })

  await createProduct({
    name: 'Hoichoi',
    slug: 'hoichoi',
    description: '1 month plan, 1 screen and 2 screen options. Watch Bengali movies, originals, and web series.',
    categoryId: streaming.id,
    basePriceBDT: '230',
    priceOptions: [
      { label: '1 Screen - 1 Month', priceBDT: '230', priceRMB: toRMB(230) },
      { label: '2 Screen - 1 Month', priceBDT: '260', priceRMB: toRMB(260) },
    ],
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Bangladesh',
    warranty: '1 Month Warranty',
    features: ['1 Screen / 2 Screen', 'Bengali Content', 'Originals', 'Web Series', 'Movies'],
    order: 7,
  })

  await createProduct({
    name: 'Chorki',
    slug: 'chorki',
    description: 'Premium account, personal account, 1 month to 1 year packages available.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-12 Months',
    accountType: 'Personal',
    region: 'Bangladesh',
    warranty: 'Full Period Warranty',
    features: ['Premium Account', 'Personal Account', 'Bangladeshi Content', 'Originals', 'Multiple Packages'],
    order: 8,
  })

  await createProduct({
    name: 'VIU',
    slug: 'viu',
    description: 'VIU Premium 1 Month, best for Korean series, shared/personal account options.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Shared / Personal',
    region: 'Bangladesh',
    warranty: '1 Month Warranty',
    features: ['Korean Series', 'Premium Content', 'Fast Subtitles', 'Multiple Options'],
    order: 9,
  })

  await createProduct({
    name: 'Hulu',
    slug: 'hulu',
    description: 'On your email with warranty, personal/shared account options.',
    categoryId: streaming.id,
    basePriceBDT: 'Market Challenge',
    duration: '1-12 Months',
    accountType: 'Personal / Shared',
    region: 'USA',
    warranty: 'Full Period Warranty',
    features: ['Own Email', 'Warranty Available', 'Live TV Option', 'Hulu Originals'],
    order: 10,
  })

  await createProduct({
    name: 'Disney Plus',
    slug: 'disney-plus',
    description: 'Shared account, includes free VPN. Watch Disney, Pixar, Marvel, Star Wars, and Nat Geo.',
    categoryId: streaming.id,
    basePriceBDT: 'Cheap',
    duration: '1-12 Months',
    accountType: 'Shared',
    region: 'USA',
    warranty: 'Warranty Available',
    features: ['Free VPN Included', 'Disney Originals', 'Marvel', 'Star Wars', '4K Streaming'],
    order: 11,
  })

  await createProduct({
    name: 'Plex TV & Movies',
    slug: 'plex-tv-movies',
    description: 'Shared account, includes free VPN.',
    categoryId: streaming.id,
    basePriceBDT: 'Cheap',
    duration: '1-12 Months',
    accountType: 'Shared',
    region: 'Global',
    warranty: 'Warranty Available',
    features: ['Free VPN Included', 'Movies & TV', 'Live TV', 'Shared Account'],
    order: 12,
  })

  await createProduct({
    name: 'Discovery+',
    slug: 'discovery-plus',
    description: '1 Month, shared/personal account options.',
    categoryId: streaming.id,
    basePriceBDT: 'Market Challenge',
    duration: '1 Month',
    accountType: 'Shared / Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Discovery Channels', 'Documentaries', 'Reality Shows'],
    order: 13,
  })

  await createProduct({
    name: 'Bongo',
    slug: 'bongo',
    description: 'Official site, 1–12 month subscriptions available.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-12 Months',
    accountType: 'Personal',
    region: 'Bangladesh',
    warranty: 'Full Period Warranty',
    features: ['Official Site', 'Bangladeshi Content', 'Multiple Durations'],
    order: 14,
  })

  await createProduct({
    name: 'KLIKK',
    slug: 'klikk',
    description: 'App/Website subscription, 1–12 month packages.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-12 Months',
    accountType: 'Personal',
    region: 'Bangladesh',
    warranty: 'Full Period Warranty',
    features: ['App & Website', 'Bangladeshi Content', 'Multiple Packages'],
    order: 15,
  })

  await createProduct({
    name: 'Showtime',
    slug: 'showtime',
    description: 'Full private account, own mail, 1 month to 1 year, warranty available.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-12 Months',
    accountType: 'Private / Own Mail',
    region: 'USA',
    warranty: 'Full Period Warranty',
    features: ['Full Private Account', 'Own Mail', 'Showtime Originals', 'Movies', 'Warranty'],
    order: 16,
  })

  await createProduct({
    name: 'WWE',
    slug: 'wwe',
    description: '1 month to 12 month subscriptions available.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-12 Months',
    accountType: 'Personal',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['WWE Network', 'Live Events', 'PPV', 'On-Demand'],
    order: 17,
  })

  await createProduct({
    name: 'Pure Flix',
    slug: 'pure-flix',
    description: '1 month to 12 month subscriptions available.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-12 Months',
    accountType: 'Personal',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['Family Content', 'Christian Movies', 'TV Shows'],
    order: 18,
  })

  await createProduct({
    name: 'Shadowz',
    slug: 'shadowz',
    description: 'Film/streaming service subscription.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-12 Months',
    accountType: 'Personal',
    region: 'Global',
    warranty: 'Warranty Available',
    features: ['Horror Movies', 'Exclusive Content', 'Streaming'],
    order: 19,
  })

  await createProduct({
    name: 'Fubo TV',
    slug: 'fubo-tv',
    description: '1 month, shared/personal account options.',
    categoryId: streaming.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Shared / Personal',
    region: 'USA',
    warranty: '1 Month Warranty',
    features: ['Live Sports', 'TV Channels', 'DVR', 'Multiple Screens'],
    order: 20,
  })

  await createProduct({
    name: 'Jio Cinema',
    slug: 'jio-cinema',
    description: '1 month premium plan, support available.',
    categoryId: streaming.id,
    basePriceBDT: '190',
    priceOptions: [
      { label: '1 Month Premium', priceBDT: '190', priceRMB: toRMB(190) },
    ],
    duration: '1 Month',
    accountType: 'Personal',
    region: 'India',
    warranty: '1 Month Warranty',
    features: ['Premium Plan', 'Support Available', 'Movies', 'Live Sports', 'TV Shows'],
    order: 21,
  })

  // ============ AI TOOLS ============
  await createProduct({
    name: 'Google Gemini AI + 2TB Google One',
    slug: 'google-gemini-ai',
    description: 'Gemini AI + 2TB Google One storage, personal email account. Access to Google\'s most advanced AI model with massive cloud storage.',
    categoryId: aiTools.id,
    basePriceBDT: '600',
    priceOptions: [
      { label: '2 Months', priceBDT: '600', priceRMB: toRMB(600) },
    ],
    duration: '2 Months',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '2 Months Warranty',
    isFeatured: true,
    features: ['Gemini Advanced', '2TB Google One', 'Personal Email', 'AI Image Generation', 'Priority Access'],
    order: 1,
  })

  await createProduct({
    name: 'Perplexity AI Pro',
    slug: 'perplexity-ai-pro',
    description: 'Perplexity AI Pro 1 month / 1 year. Advanced AI-powered search and research assistant.',
    categoryId: aiTools.id,
    basePriceBDT: '2500',
    priceOptions: [
      { label: '1 Month', priceBDT: '2500', priceRMB: toRMB(2500) },
    ],
    duration: '1 Month / 1 Year',
    accountType: 'Personal',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['AI Search', 'Pro Features', 'File Upload', 'API Access', 'Claude/GPT-4'],
    order: 2,
  })

  await createProduct({
    name: 'Jarvis AI',
    slug: 'jarvis-ai',
    description: 'Best AI assistant, powered by GPT-4.5. Your personal AI copilot for writing, coding, and productivity.',
    categoryId: aiTools.id,
    basePriceBDT: '600',
    priceOptions: [
      { label: 'Basic', priceBDT: '600', priceRMB: toRMB(600) },
      { label: 'Standard', priceBDT: '800', priceRMB: toRMB(800) },
      { label: 'Premium', priceBDT: '1200', priceRMB: toRMB(1200) },
    ],
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['GPT-4.5 Powered', 'Writing Assistant', 'Coding Help', 'Productivity Tools', 'Voice Commands'],
    order: 3,
  })

  await createProduct({
    name: 'Midjourney',
    slug: 'midjourney',
    description: 'Midjourney Pro Plan, original account, warranty available, full account with mail access. Create stunning AI-generated artwork.',
    categoryId: aiTools.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal / Mail Access',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['AI Art Generation', 'Pro Plan', 'Original Account', 'Mail Access', 'High Quality Output'],
    order: 4,
  })

  await createProduct({
    name: 'AutoShorts AI',
    slug: 'autoshorts-ai',
    description: 'Personal own email account. AI-powered short video creation tool.',
    categoryId: aiTools.id,
    basePriceBDT: '1500',
    priceOptions: [
      { label: 'Starter $19 Plan', priceBDT: '1500', priceRMB: toRMB(1500) },
      { label: 'Daily $39 Plan', priceBDT: '2500', priceRMB: toRMB(2500) },
      { label: 'Hardcore $69 Plan', priceBDT: '3200', priceRMB: toRMB(3200) },
    ],
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['AI Video Creation', 'Auto Shorts', 'Own Email', 'Multiple Plans', 'YouTube Integration'],
    order: 5,
  })

  await createProduct({
    name: 'Cursor AI',
    slug: 'cursor-ai',
    description: 'Personal account, warranty full. AI-powered code editor for faster development.',
    categoryId: aiTools.id,
    basePriceBDT: '2100',
    priceOptions: [
      { label: '1 Month', priceBDT: '2100', priceRMB: toRMB(2100) },
    ],
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    features: ['AI Code Editor', 'Auto Complete', 'Code Generation', 'Bug Fixing', 'Personal Account'],
    order: 6,
  })

  await createProduct({
    name: 'Leonardo AI',
    slug: 'leonardo-ai',
    description: 'AI image generation and creative tool product.',
    categoryId: aiTools.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['AI Image Generation', 'Creative Tools', 'Multiple Models', 'High Resolution'],
    order: 7,
  })

  await createProduct({
    name: 'Ideogram',
    slug: 'ideogram',
    description: 'AI image and creative tool product.',
    categoryId: aiTools.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['AI Image Generation', 'Text in Images', 'Creative Design', 'High Quality'],
    order: 8,
  })

  await createProduct({
    name: 'Uizard AI',
    slug: 'uizard-ai',
    description: 'AI design tool for UI, apps, websites, software. Readymade access, own mail possible.',
    categoryId: aiTools.id,
    basePriceBDT: 'Market Challenge',
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['UI Design', 'App Prototyping', 'Website Design', 'AI Wireframe', 'Readymade Access'],
    order: 9,
  })

  await createProduct({
    name: 'Microsoft Copilot',
    slug: 'microsoft-copilot',
    description: '1–12 month, full private account. AI assistant integrated with Microsoft 365.',
    categoryId: aiTools.id,
    basePriceBDT: 'Market Lowest',
    duration: '1-12 Months',
    accountType: 'Private / Own Mail',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['Microsoft 365 Integration', 'AI Assistant', 'Private Account', 'Coding Help', 'Document Generation'],
    order: 10,
  })

  await createProduct({
    name: 'Tabnine',
    slug: 'tabnine',
    description: 'AI coding assistant, mail/mail access. Smart code completion for developers.',
    categoryId: aiTools.id,
    basePriceBDT: 'Market Lowest',
    duration: '1 Month',
    accountType: 'Personal / Mail Access',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['AI Code Completion', 'Multiple Languages', 'IDE Integration', 'Private Models'],
    order: 11,
  })

  await createProduct({
    name: 'Ninja AI',
    slug: 'ninja-ai',
    description: 'All-in-one AI assistant for writing, creating and chatting with AI tools.',
    categoryId: aiTools.id,
    basePriceBDT: 'Market Challenge',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['All-in-One AI', 'Writing', 'Creating', 'Chatting', 'Multiple AI Tools'],
    order: 12,
  })

  // AI Collection products
  const aiCollectionProducts = [
    { name: 'Remini AI', slug: 'remini-ai' },
    { name: 'ChatGPT Plus', slug: 'chatgpt-plus' },
    { name: 'NinjaChat AI', slug: 'ninjachatai' },
    { name: 'Jenni AI', slug: 'jenni-ai' },
    { name: 'Fliki AI', slug: 'fliki-ai' },
    { name: 'Pika Art AI', slug: 'pika-art-ai' },
    { name: 'Krea AI', slug: 'krea-ai' },
    { name: 'Vizard AI', slug: 'vizard-ai' },
    { name: 'Character AI', slug: 'character-ai' },
    { name: 'Vondy AI', slug: 'vondy-ai' },
    { name: 'Resemble AI', slug: 'resemble-ai' },
    { name: 'Humata AI', slug: 'humata-ai' },
    { name: 'Mister Horse AI', slug: 'mister-horse-ai' },
    { name: 'Gamma AI', slug: 'gamma-ai' },
    { name: 'DeepL AI', slug: 'deepl-ai' },
    { name: 'CustomGPT', slug: 'customgpt' },
  ]

  for (let i = 0; i < aiCollectionProducts.length; i++) {
    const p = aiCollectionProducts[i]
    await createProduct({
      name: p.name,
      slug: p.slug,
      description: `${p.name} subscription. AI-powered tool for various use cases. Contact for pricing and availability.`,
      categoryId: aiTools.id,
      basePriceBDT: 'Inbox Price',
      duration: '1 Month',
      accountType: 'Personal',
      region: 'Global',
      warranty: 'Warranty Available',
      features: ['AI Powered', 'Subscription Based', 'Warranty Available'],
      order: 13 + i,
    })
  }

  // ============ EDUCATIONAL ============
  await createProduct({
    name: 'Coursera Plus',
    slug: 'coursera-plus',
    description: 'Professional plan / 12 months / own mail / warranty. Access to 7,000+ courses from top universities and companies.',
    categoryId: educational.id,
    basePriceBDT: '800',
    priceOptions: [
      { label: 'Professional Plan', priceBDT: '800', priceRMB: toRMB(800) },
      { label: '1 Year (Inbox)', priceBDT: 'Inbox Price', priceRMB: 'Ask for RMB price' },
    ],
    duration: '1-12 Months',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    features: ['7000+ Courses', 'Professional Certificates', 'Own Mail', 'Universities', 'Full Warranty'],
    order: 1,
  })

  await createProduct({
    name: 'Coursera',
    slug: 'coursera',
    description: 'On your personal mail, 1 year validity, full period warranty.',
    categoryId: educational.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Year',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['Personal Mail', '1 Year Validity', 'Full Warranty', 'Course Access'],
    order: 2,
  })

  await createProduct({
    name: 'Grammarly Premium',
    slug: 'grammarly-premium',
    description: 'Grammarly Premium writing assistant. Improve your writing with AI-powered grammar, spelling, and style suggestions.',
    categoryId: educational.id,
    basePriceBDT: '350',
    priceOptions: [
      { label: '1 Month', priceBDT: '350', priceRMB: toRMB(350) },
      { label: '3 Months', priceBDT: '950', priceRMB: toRMB(950) },
      { label: '6 Months', priceBDT: '1700', priceRMB: toRMB(1700) },
      { label: '12 Months', priceBDT: '2500', priceRMB: toRMB(2500) },
    ],
    duration: '1-12 Months',
    accountType: 'Personal',
    region: 'Global',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    isBestSeller: true,
    features: ['Grammar Check', 'Plagiarism Detection', 'Style Suggestions', 'AI Writing', 'Tone Detection'],
    order: 3,
  })

  await createProduct({
    name: 'Scribd',
    slug: 'scribd',
    description: 'Scribd Pro 1 month, warranty available. Access millions of books, audiobooks, magazines, and documents.',
    categoryId: educational.id,
    basePriceBDT: 'Market Lowest',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Millions of Books', 'Audiobooks', 'Magazines', 'Documents', 'Pro Access'],
    order: 4,
  })

  await createProduct({
    name: 'Audible Plus',
    slug: 'audible-plus',
    description: '1 month, best for audiobooks, own Gmail account.',
    categoryId: educational.id,
    basePriceBDT: 'Cheap',
    duration: '1 Month',
    accountType: 'Personal / Own Gmail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Audiobooks', 'Own Gmail', 'Originals', 'Podcasts', 'Offline Listening'],
    order: 5,
  })

  await createProduct({
    name: 'Quizlet Plus',
    slug: 'quizlet-plus',
    description: 'Own mail, 1 month. AI-powered study tools for students.',
    categoryId: educational.id,
    basePriceBDT: '500',
    priceOptions: [
      { label: '1 Month', priceBDT: '500', priceRMB: toRMB(500) },
    ],
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['AI Study Tools', 'Own Mail', 'Flashcards', 'Practice Tests', 'Textbook Solutions'],
    order: 6,
  })

  await createProduct({
    name: 'Course Hero',
    slug: 'course-hero',
    description: 'AI homework help, 1 month Premier+ plan, private mail access.',
    categoryId: educational.id,
    basePriceBDT: '1200',
    priceOptions: [
      { label: '1 Month Premier+', priceBDT: '1200', priceRMB: toRMB(1200) },
    ],
    duration: '1 Month',
    accountType: 'Private Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['AI Homework Help', 'Premier+ Plan', 'Private Mail', 'Textbook Solutions', 'Tutor Access'],
    order: 7,
  })

  await createProduct({
    name: 'Skillshare',
    slug: 'skillshare',
    description: '1 year premium, fresh made, warranty, own mail. Learn creative skills from industry professionals.',
    categoryId: educational.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Year',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['1 Year Premium', 'Fresh Made', 'Own Mail', 'Creative Courses', 'Projects'],
    order: 8,
  })

  await createProduct({
    name: 'DataCamp',
    slug: 'datacamp',
    description: 'Learn Premium, 3 months, own mail, warranty. Data science and analytics courses.',
    categoryId: educational.id,
    basePriceBDT: 'Inbox Price',
    duration: '3 Months',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '3 Months Warranty',
    features: ['Data Science', 'Analytics', 'Premium Access', 'Own Mail', 'Projects'],
    order: 9,
  })

  await createProduct({
    name: 'Duolingo Super Plus',
    slug: 'duolingo-super-plus',
    description: '1 to 6 months, personal account, own email. Learn languages ad-free with unlimited hearts.',
    categoryId: educational.id,
    basePriceBDT: 'Inbox Price',
    duration: '1-6 Months',
    accountType: 'Personal / Own Email',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['Ad-Free', 'Unlimited Hearts', 'Own Email', 'Multiple Languages', 'Offline Lessons'],
    order: 10,
  })

  await createProduct({
    name: 'Bookmate',
    slug: 'bookmate',
    description: '1 month, alternative to Scribd, on your mail.',
    categoryId: educational.id,
    basePriceBDT: 'Lowest',
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Ebooks', 'Audiobooks', 'Own Mail', 'Alternative to Scribd'],
    order: 11,
  })

  await createProduct({
    name: 'Rakuten Kobo',
    slug: 'rakuten-kobo',
    description: 'Kobo Plus Read & Listen, 1 month, audiobooks and ebooks.',
    categoryId: educational.id,
    basePriceBDT: 'Lowest',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Ebooks', 'Audiobooks', 'Kobo Plus', 'Read & Listen'],
    order: 12,
  })

  // ============ DESIGN & CREATIVE ============
  await createProduct({
    name: 'Adobe Creative Cloud',
    slug: 'adobe-creative-cloud',
    description: 'Design, illustration, video, motion, photography, web & UX design, document management, 3D & AR, social media tools. The complete creative suite.',
    categoryId: designCreative.id,
    basePriceBDT: '1200',
    priceOptions: [
      { label: 'Standard', priceBDT: '1200', priceRMB: toRMB(1200) },
      { label: 'Alternate (Inbox)', priceBDT: 'Inbox Price', priceRMB: 'Ask for RMB price' },
    ],
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    isFeatured: true,
    features: ['Photoshop', 'Illustrator', 'Premiere Pro', 'After Effects', 'All Adobe Apps'],
    order: 1,
  })

  await createProduct({
    name: 'Adobe Stock',
    slug: 'adobe-stock',
    description: '40/25 assets a month, 40 standard assets or 6 HD videos, 30 days, own mail, warranty.',
    categoryId: designCreative.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['40 Assets/Month', 'HD Videos', 'Stock Photos', 'Own Mail', 'Warranty'],
    order: 2,
  })

  await createProduct({
    name: 'CapCut Pro',
    slug: 'capcut-pro',
    description: '1 month CapCut Pro subscription. Professional video editing with AI-powered features.',
    categoryId: designCreative.id,
    basePriceBDT: '500',
    priceOptions: [
      { label: '1 Month', priceBDT: '500', priceRMB: toRMB(500) },
    ],
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Pro Features', 'AI Editing', 'No Watermark', 'Templates', 'Effects'],
    order: 3,
  })

  await createProduct({
    name: 'Figma Professional',
    slug: 'figma-professional',
    description: 'Professional plan, personal own email, full warranty. Collaborative design tool for teams.',
    categoryId: designCreative.id,
    basePriceBDT: '900',
    priceOptions: [
      { label: '1 Month', priceBDT: '900', priceRMB: toRMB(900) },
    ],
    duration: '1 Month',
    accountType: 'Personal / Own Email',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['Professional Plan', 'Own Email', 'Collaboration', 'Components', 'Full Warranty'],
    order: 4,
  })

  await createProduct({
    name: 'Freepik',
    slug: 'freepik',
    description: '1 month / multiple profile options. Access millions of graphic resources, vectors, and photos.',
    categoryId: designCreative.id,
    basePriceBDT: '550',
    priceOptions: [
      { label: 'Basic', priceBDT: '550', priceRMB: toRMB(550) },
      { label: 'Standard', priceBDT: '800', priceRMB: toRMB(800) },
      { label: 'Premium', priceBDT: '1500', priceRMB: toRMB(1500) },
    ],
    duration: '1 Month',
    accountType: 'Personal / Multiple Profile',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Vectors', 'Photos', 'PSD Files', 'Icons', 'Premium Resources'],
    order: 5,
  })

  await createProduct({
    name: 'Canva Pro',
    slug: 'canva-pro',
    description: '1 year+, stock unlimited, on your email, full warranty. Design anything with premium templates and features.',
    categoryId: designCreative.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Year+',
    accountType: 'Personal / Own Email',
    region: 'Global',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    isBestSeller: true,
    features: ['1 Year+', 'Unlimited Stock', 'Own Email', 'Premium Templates', 'Full Warranty'],
    order: 6,
  })

  await createProduct({
    name: 'iStock by Getty Images',
    slug: 'istock',
    description: '1 month / 2 month subscriptions available.',
    categoryId: designCreative.id,
    basePriceBDT: '800',
    priceOptions: [
      { label: '1 Month', priceBDT: '800', priceRMB: toRMB(800) },
      { label: '2 Months', priceBDT: '1600', priceRMB: toRMB(1600) },
    ],
    duration: '1-2 Months',
    accountType: 'Personal',
    region: 'Global',
    warranty: 'Full Period Warranty',
    features: ['Stock Photos', 'Illustrations', 'Video Clips', 'Premium Content'],
    order: 7,
  })

  await createProduct({
    name: 'Getty Images',
    slug: 'getty-images',
    description: 'Premium stock images and videos subscription.',
    categoryId: designCreative.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Premium Stock', 'Editorial Images', '4K Video', 'Professional Content'],
    order: 8,
  })

  await createProduct({
    name: 'Filmora 13',
    slug: 'filmora-13',
    description: 'Lifetime/yearly plan available. Easy video editing software with AI features.',
    categoryId: designCreative.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Year / Lifetime',
    accountType: 'Personal / License',
    region: 'Global',
    warranty: 'License Warranty',
    features: ['Lifetime Option', 'AI Features', 'Easy Editing', 'Effects & Templates', '4K Support'],
    order: 9,
  })

  await createProduct({
    name: 'Beautiful.ai',
    slug: 'beautiful-ai',
    description: '12 months, AI presentation software, personal mail/access.',
    categoryId: designCreative.id,
    basePriceBDT: 'Market Lowest',
    duration: '12 Months',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '12 Months Warranty',
    features: ['AI Presentations', '12 Months', 'Personal Mail', 'Templates', 'Smart Formatting'],
    order: 10,
  })

  await createProduct({
    name: 'Autodesk',
    slug: 'autodesk',
    description: '1 year validity, all Autodesk apps included.',
    categoryId: designCreative.id,
    basePriceBDT: '900',
    priceOptions: [
      { label: '1 Year', priceBDT: '900', priceRMB: toRMB(900) },
    ],
    duration: '1 Year',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Year Warranty',
    features: ['All Autodesk Apps', '1 Year Validity', '3D Design', 'Engineering', 'Architecture'],
    order: 11,
  })

  await createProduct({
    name: 'AutoCAD',
    slug: 'autocad',
    description: '1 year validity, includes many Autodesk apps/tools.',
    categoryId: designCreative.id,
    basePriceBDT: '1200',
    priceOptions: [
      { label: '1 Year', priceBDT: '1200', priceRMB: toRMB(1200) },
    ],
    duration: '1 Year',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Year Warranty',
    features: ['AutoCAD', '1 Year Validity', '2D/3D Design', 'Professional Tools', 'Multiple Apps'],
    order: 12,
  })

  await createProduct({
    name: 'Bootstrap Studio',
    slug: 'bootstrap-studio',
    description: '1 year license. Professional web design tool.',
    categoryId: designCreative.id,
    basePriceBDT: '900',
    priceOptions: [
      { label: '1 Year', priceBDT: '900', priceRMB: toRMB(900) },
    ],
    duration: '1 Year',
    accountType: 'License',
    region: 'Global',
    warranty: '1 Year Warranty',
    features: ['Web Design', 'Bootstrap Framework', 'Drag & Drop', 'Responsive', '1 Year License'],
    order: 13,
  })

  await createProduct({
    name: 'BrowserStack',
    slug: 'browserstack',
    description: '1 year subscription. Cross-browser testing platform.',
    categoryId: designCreative.id,
    basePriceBDT: '1200',
    priceOptions: [
      { label: '1 Year', priceBDT: '1200', priceRMB: toRMB(1200) },
    ],
    duration: '1 Year',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Year Warranty',
    features: ['Cross-Browser Testing', 'Real Devices', '1 Year Access', 'Automated Testing'],
    order: 14,
  })

  // ============ PRODUCTIVITY / BUSINESS ============
  await createProduct({
    name: 'Microsoft Office 365',
    slug: 'microsoft-office-365',
    description: 'Personal/Family + 1TB OneDrive, personal mail, 1 to 6 users, 1 year+ subscription, full account.',
    categoryId: productivity.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Year+',
    accountType: 'Personal / Family',
    region: 'Global',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    features: ['1TB OneDrive', 'Personal/Family', '1-6 Users', '1 Year+', 'Full Account'],
    order: 1,
  })

  await createProduct({
    name: 'Zoom Pro',
    slug: 'zoom-pro',
    description: 'Premium, in your mail, renewable, 100 participants, no 40-minute limit, AI features, 5GB cloud storage.',
    categoryId: productivity.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['100 Participants', 'No 40-Min Limit', 'AI Features', '5GB Cloud', 'Renewable'],
    order: 2,
  })

  await createProduct({
    name: 'TradingView',
    slug: 'tradingview',
    description: 'Premium 1 month, own mail, full period warranty. Advanced charting and trading platform.',
    categoryId: productivity.id,
    basePriceBDT: '800',
    priceOptions: [
      { label: '1 Month Premium', priceBDT: '800', priceRMB: toRMB(800) },
    ],
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    features: ['Premium Charts', 'Own Mail', 'Real-Time Data', 'Indicators', 'Full Warranty'],
    order: 3,
  })

  await createProduct({
    name: 'IMDb Pro',
    slug: 'imdb-pro',
    description: '1 month, personal mail. Access to entertainment industry information and tools.',
    categoryId: productivity.id,
    basePriceBDT: '250',
    priceOptions: [
      { label: '1 Month', priceBDT: '250', priceRMB: toRMB(250) },
    ],
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Industry Data', 'Personal Mail', 'Pro Tools', 'Contacts', 'Resume Feature'],
    order: 4,
  })

  await createProduct({
    name: 'QuillBot',
    slug: 'quillbot',
    description: 'Premium account, personal/shared, warranty, 1 year. AI-powered paraphrasing and writing tool.',
    categoryId: productivity.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Year',
    accountType: 'Personal / Shared',
    region: 'Global',
    warranty: '1 Year Warranty',
    features: ['AI Paraphrasing', 'Grammar Check', 'Citation Generator', '1 Year Access'],
    order: 5,
  })

  await createProduct({
    name: 'Calm Premium',
    slug: 'calm-premium',
    description: 'Premium account, personal/shared, warranty, 1 year. Meditation and sleep app.',
    categoryId: productivity.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Year',
    accountType: 'Personal / Shared',
    region: 'Global',
    warranty: '1 Year Warranty',
    features: ['Meditation', 'Sleep Stories', 'Music', '1 Year Access', 'Warranty'],
    order: 6,
  })

  await createProduct({
    name: 'Telegram Premium',
    slug: 'telegram-premium',
    description: 'Premium subscription and Telegram Stars. Enhanced messaging features.',
    categoryId: productivity.id,
    basePriceBDT: '2900',
    priceOptions: [
      { label: '3 Months Premium', priceBDT: '2900', priceRMB: toRMB(2900) },
      { label: '6 Months Premium', priceBDT: '4000', priceRMB: toRMB(4000) },
      { label: '1 Year Premium', priceBDT: '6800', priceRMB: toRMB(6800) },
      { label: '100 Stars', priceBDT: '380', priceRMB: toRMB(380) },
      { label: '250 Stars', priceBDT: '750', priceRMB: toRMB(750) },
      { label: '500 Stars', priceBDT: '1280', priceRMB: toRMB(1280) },
      { label: '1000 Stars', priceBDT: '2460', priceRMB: toRMB(2460) },
      { label: '2500 Stars', priceBDT: '6900', priceRMB: toRMB(6900) },
    ],
    duration: '3-12 Months',
    accountType: 'Personal',
    region: 'Global',
    warranty: 'Full Period Warranty',
    isFeatured: true,
    isBestSeller: true,
    features: ['Premium Features', '4GB Upload', 'Exclusive Stickers', 'Faster Downloads', 'Stars for Reactions'],
    order: 7,
  })

  // ============ CLOUD / STORAGE ============
  await createProduct({
    name: 'Google One',
    slug: 'google-one',
    description: '100GB, 200GB, 2TB, 1 year validity, own mail, full warranty. Cloud storage with Google ecosystem.',
    categoryId: cloudStorage.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Year',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Year Warranty',
    features: ['100GB/200GB/2TB', 'Own Mail', '1 Year Validity', 'Google Ecosystem', 'Full Warranty'],
    order: 1,
  })

  await createProduct({
    name: 'TeraBox Premium',
    slug: 'terabox-premium',
    description: '1 month, own mail. 1TB cloud storage.',
    categoryId: cloudStorage.id,
    basePriceBDT: 'Market Lowest',
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['1TB Storage', 'Own Mail', 'Fast Upload', 'Video Player'],
    order: 2,
  })

  await createProduct({
    name: 'MEGA',
    slug: 'mega',
    description: 'MEGA cloud storage subscription.',
    categoryId: cloudStorage.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['Encrypted Storage', 'Large Storage', 'Secure Sharing', 'Fast Transfer'],
    order: 3,
  })

  // ============ VPN ============
  await createProduct({
    name: 'Windscribe VPN',
    slug: 'windscribe-vpn',
    description: '30 days premium, unlimited device, personal mail, warranty, 1 month.',
    categoryId: vpn.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal / Own Mail',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['30 Days Premium', 'Unlimited Devices', 'Personal Mail', 'Warranty'],
    order: 1,
  })

  const vpnProducts = [
    'Proton VPN', 'Vypr VPN', 'PIA VPN', 'NordVPN', 'HMA VPN',
    'AVG VPN', 'NoLag VPN', 'Seed4Me VPN', 'ExpressVPN', 'IPVanish VPN',
    'Surfshark VPN', 'CyberGhost VPN', 'Avast SecureLine VPN', 'Hotspot Shield VPN'
  ]

  for (let i = 0; i < vpnProducts.length; i++) {
    const vpnName = vpnProducts[i]
    await createProduct({
      name: vpnName,
      slug: vpnName.toLowerCase().replace(/ /g, '-'),
      description: `${vpnName} subscription, 1-12 months, warranty available. Secure and private browsing.`,
      categoryId: vpn.id,
      basePriceBDT: 'Low Price',
      duration: '1-12 Months',
      accountType: 'Personal',
      region: 'Global',
      warranty: 'Warranty Available',
      features: ['VPN Protection', 'Warranty Available', 'Multiple Servers', 'Fast Speed', 'Privacy'],
      order: 2 + i,
    })
  }

  // ============ GIFT CARDS / APPLE ============
  await createProduct({
    name: 'iTunes Gift Card',
    slug: 'itunes-gift-card',
    description: 'USA region iTunes gift cards. Stackable cards for App Store, iTunes, and Apple services.',
    categoryId: giftCards.id,
    basePriceBDT: 'Inbox Price',
    priceOptions: [
      { label: '$5', priceBDT: 'Inbox Price', priceRMB: 'Ask for RMB price' },
      { label: '$10', priceBDT: 'Inbox Price', priceRMB: 'Ask for RMB price' },
      { label: '$15', priceBDT: 'Inbox Price', priceRMB: 'Ask for RMB price' },
      { label: '$20', priceBDT: 'Inbox Price', priceRMB: 'Ask for RMB price' },
      { label: '$25', priceBDT: 'Inbox Price', priceRMB: 'Ask for RMB price' },
      { label: '$50', priceBDT: 'Inbox Price', priceRMB: 'Ask for RMB price' },
    ],
    duration: 'One-time',
    accountType: 'Gift Card',
    region: 'USA',
    warranty: 'Working Guarantee',
    features: ['USA Region', 'Stackable', 'App Store', 'iTunes', 'Apple Services'],
    order: 1,
  })

  await createProduct({
    name: 'Apple Music',
    slug: 'apple-music',
    description: 'Apple Music 2 Month subscription.',
    categoryId: giftCards.id,
    basePriceBDT: 'Inbox Price',
    duration: '2 Months',
    accountType: 'Gift Card / Subscription',
    region: 'Global',
    warranty: '2 Months Warranty',
    features: ['Apple Music', '2 Months', 'Millions of Songs', 'Offline Listening'],
    order: 2,
  })

  await createProduct({
    name: 'Apple TV+',
    slug: 'apple-tv-plus',
    description: 'Apple TV+ 3 Month subscription.',
    categoryId: giftCards.id,
    basePriceBDT: 'Inbox Price',
    duration: '3 Months',
    accountType: 'Gift Card / Subscription',
    region: 'Global',
    warranty: '3 Months Warranty',
    features: ['Apple TV+', '3 Months', 'Apple Originals', '4K HDR'],
    order: 3,
  })

  await createProduct({
    name: 'Apple iCloud',
    slug: 'apple-icloud',
    description: 'Apple iCloud 3 Month 50GB storage.',
    categoryId: giftCards.id,
    basePriceBDT: 'Inbox Price',
    duration: '3 Months',
    accountType: 'Gift Card / Subscription',
    region: 'Global',
    warranty: '3 Months Warranty',
    features: ['50GB Storage', '3 Months', 'iCloud Backup', 'Photos'],
    order: 4,
  })

  await createProduct({
    name: 'Apple Fitness+',
    slug: 'apple-fitness-plus',
    description: 'Apple Fitness+ 3 Month subscription.',
    categoryId: giftCards.id,
    basePriceBDT: 'Inbox Price',
    duration: '3 Months',
    accountType: 'Gift Card / Subscription',
    region: 'Global',
    warranty: '3 Months Warranty',
    features: ['Fitness+', '3 Months', 'Workouts', 'Meditations'],
    order: 5,
  })

  await createProduct({
    name: 'Apple Arcade',
    slug: 'apple-arcade',
    description: 'Apple Arcade 4 Month subscription.',
    categoryId: giftCards.id,
    basePriceBDT: 'Inbox Price',
    duration: '4 Months',
    accountType: 'Gift Card / Subscription',
    region: 'Global',
    warranty: '4 Months Warranty',
    features: ['Apple Arcade', '4 Months', '200+ Games', 'No Ads'],
    order: 6,
  })

  await createProduct({
    name: 'Apple News+',
    slug: 'apple-news-plus',
    description: 'Apple News+ 4 Month subscription.',
    categoryId: giftCards.id,
    basePriceBDT: 'Inbox Price',
    duration: '4 Months',
    accountType: 'Gift Card / Subscription',
    region: 'Global',
    warranty: '4 Months Warranty',
    features: ['Apple News+', '4 Months', 'Hundreds of Magazines', 'Newspapers'],
    order: 7,
  })

  await createProduct({
    name: 'MLS Season Pass',
    slug: 'mls-season-pass',
    description: 'MLS Season Pass 1 Month subscription.',
    categoryId: giftCards.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Gift Card / Subscription',
    region: 'Global',
    warranty: '1 Month Warranty',
    features: ['MLS Season Pass', '1 Month', 'Live Matches', 'Replays'],
    order: 8,
  })

  // ============ GAMING TOPUP ============
  await createProduct({
    name: 'Free Fire TopUp',
    slug: 'free-fire-topup',
    description: 'সকল ধরণের অনলাইন গেমস এর টপ আপ করতে পারবেন সুলভ দামে। UID code বা Gmail ID/password দিয়ে top-up করা যাবে.',
    categoryId: gamingTopup.id,
    basePriceBDT: 'Custom',
    duration: 'One-time',
    accountType: 'TopUp',
    region: 'Global',
    warranty: 'Delivery Guarantee',
    features: ['UID Code TopUp', 'Gmail ID/Password', 'Fast Delivery', 'Affordable'],
    order: 1,
  })

  await createProduct({
    name: 'PUBG TopUp',
    slug: 'pubg-topup',
    description: 'PUBG Mobile UC top-up at affordable prices. UID code or Gmail ID/password method.',
    categoryId: gamingTopup.id,
    basePriceBDT: 'Custom',
    duration: 'One-time',
    accountType: 'TopUp',
    region: 'Global',
    warranty: 'Delivery Guarantee',
    features: ['UC TopUp', 'UID Code', 'Gmail Method', 'Fast Delivery'],
    order: 2,
  })

  await createProduct({
    name: 'Clash of Clans Gems',
    slug: 'clash-of-clans-gems',
    description: 'Clash of Clans gems top-up at affordable prices.',
    categoryId: gamingTopup.id,
    basePriceBDT: 'Custom',
    duration: 'One-time',
    accountType: 'TopUp',
    region: 'Global',
    warranty: 'Delivery Guarantee',
    features: ['Gems TopUp', 'Fast Delivery', 'Affordable'],
    order: 3,
  })

  await createProduct({
    name: 'Call of Duty TopUp',
    slug: 'call-of-duty-topup',
    description: 'Call of Duty Mobile CP top-up at affordable prices.',
    categoryId: gamingTopup.id,
    basePriceBDT: 'Custom',
    duration: 'One-time',
    accountType: 'TopUp',
    region: 'Global',
    warranty: 'Delivery Guarantee',
    features: ['CP TopUp', 'Fast Delivery', 'Affordable'],
    order: 4,
  })

  await createProduct({
    name: 'E-Football TopUp',
    slug: 'e-football-topup',
    description: 'E-Football game top-up at affordable prices.',
    categoryId: gamingTopup.id,
    basePriceBDT: 'Custom',
    duration: 'One-time',
    accountType: 'TopUp',
    region: 'Global',
    warranty: 'Delivery Guarantee',
    features: ['Coins TopUp', 'Fast Delivery', 'Affordable'],
    order: 5,
  })

  await createProduct({
    name: 'FC Coin TopUp',
    slug: 'fc-coin-topup',
    description: 'EA FC Coin top-up at affordable prices.',
    categoryId: gamingTopup.id,
    basePriceBDT: 'Custom',
    duration: 'One-time',
    accountType: 'TopUp',
    region: 'Global',
    warranty: 'Delivery Guarantee',
    features: ['FC Coins', 'Fast Delivery', 'Affordable'],
    order: 6,
  })

  // ============ MULTI COLLECTION ============
  const multiProducts = [
    { name: 'Viu', slug: 'viu-multi' },
    { name: 'Scribd Pro', slug: 'scribd-multi' },
    { name: 'Remini Pro', slug: 'remini-multi' },
    { name: 'Freepik Premium', slug: 'freepik-multi' },
    { name: 'Turnitin', slug: 'turnitin' },
    { name: 'QuillBot Premium', slug: 'quillbot-multi' },
    { name: 'IDM Pro', slug: 'idm-pro' },
    { name: 'IMDb Pro Access', slug: 'imdb-multi' },
    { name: 'ElevenLabs', slug: 'elevenlabs' },
    { name: 'Deezer Music', slug: 'deezer-music' },
    { name: 'Rakuten Kobo Plus', slug: 'kobo-multi' },
    { name: 'Prime Gaming', slug: 'prime-gaming' },
    { name: 'Super Duolingo', slug: 'super-duolingo' },
  ]

  for (let i = 0; i < multiProducts.length; i++) {
    const p = multiProducts[i]
    await createProduct({
      name: p.name,
      slug: p.slug,
      description: `${p.name} subscription. Contact for pricing and availability.`,
      categoryId: multiCollection.id,
      basePriceBDT: 'Market Lowest',
      duration: '1 Month',
      accountType: 'Personal',
      region: 'Global',
      warranty: 'Warranty Available',
      features: ['Premium Access', 'Affordable Price', 'Warranty Available'],
      order: i + 1,
    })
  }

  // ============ ADULT 18+ ============
  await createProduct({
    name: 'Ullu Gold',
    slug: 'ullu-gold',
    description: 'Ullu Gold subscription. Premium adult content.',
    categoryId: adult.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'India',
    warranty: '1 Month Warranty',
    features: ['Gold Access', 'Premium Content', 'Originals'],
    order: 1,
  })

  await createProduct({
    name: 'Kooku Gold',
    slug: 'kooku-gold',
    description: 'Kooku Gold subscription. Premium adult content.',
    categoryId: adult.id,
    basePriceBDT: 'Inbox Price',
    duration: '1 Month',
    accountType: 'Personal',
    region: 'India',
    warranty: '1 Month Warranty',
    features: ['Gold Access', 'Premium Content', 'Originals'],
    order: 2,
  })

  // ============ REVIEWS ============
  await prisma.review.createMany({
    data: [
      { name: 'Rahim Uddin', rating: 5, text: 'Excellent service! Got my Netflix subscription within 10 minutes. Very professional and trustworthy.', product: 'Netflix', isApproved: true },
      { name: 'Fatima Akter', rating: 5, text: 'Grammarly Premium এর জন্য অর্ডার করেছিলাম, ৫ মিনিটের মধ্যে ডেলিভারি পেলাম। অসাধারণ সার্ভিস!', product: 'Grammarly Premium', isApproved: true },
      { name: 'Kamal Hossain', rating: 5, text: 'Canva Pro ১ বছরের সাবস্ক্রিপশন নিলাম, খুবই সাশ্রয়ী দামে পেলাম। ধন্যবাদ Subscription Lagbe!', product: 'Canva Pro', isApproved: true },
      { name: 'Nusrat Jahan', rating: 4, text: 'YouTube Premium নিলাম, বাংলাদেশ অ্যাকাউন্ট, VPN লাগছে না। সব ঠিক আছে।', product: 'YouTube Premium', isApproved: true },
      { name: 'Sakib Ahmed', rating: 5, text: 'Adobe Creative Cloud সাবস্ক্রিপশন নিলাম। সব অ্যাপ কাজ করছে, warranty ও আছে। ভালো সার্ভিস।', product: 'Adobe Creative Cloud', isApproved: true },
      { name: 'Tanjim Rahman', rating: 5, text: 'PUBG top-up করলাম, ৫ মিনিটে ডেলিভারি। দাম ও সস্তা।', product: 'PUBG TopUp', isApproved: true },
      { name: 'Mim Akter', rating: 4, text: 'Coursera Plus সাবস্ক্রিপশন নিলাম, নিজের মেইলে। খুবই ভালো অভিজ্ঞতা।', product: 'Coursera Plus', isApproved: true },
      { name: 'Arif Islam', rating: 5, text: 'TradingView Premium নিলাম, own mail এ। সব ফিচার কাজ করছে। Highly recommended!', product: 'TradingView', isApproved: true },
    ]
  })

  console.log('✅ Seed completed successfully!')
  console.log(`Categories: ${categories.length}`)
  const productCount = await prisma.product.count()
  console.log(`Products: ${productCount}`)
  const reviewCount = await prisma.review.count()
  console.log(`Reviews: ${reviewCount}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
