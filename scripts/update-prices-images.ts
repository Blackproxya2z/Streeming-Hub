import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Products with specific generated images
const PRODUCT_IMAGES = new Set([
  'netflix', 'youtube-premium', 'amazon-prime-video', 'hotstar', 'crunchyroll',
  'chatgpt-plus', 'google-gemini-ai', 'perplexity-ai-pro', 'cursor-ai', 'midjourney',
  'grammarly-premium', 'coursera-plus', 'adobe-creative-cloud', 'canva-pro',
  'microsoft-office-365', 'nordvpn', 'figma-professional', 'capcut-pro',
  'disney-plus', 'hulu', 'sony-liv', 'hoichoi', 'skillshare', 'freepik',
  'google-one', 'expressvpn', 'jarvis-ai', 'autoshorts-ai', 'tradingview',
]);

// Category slug mapping (from database)
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'cmoih2a8r0009k8ubc5t0c5hk': 'streaming',
  'cmoih2a8r000ak8ubzuht3sqt': 'vpn',
  'cmoih2a8u000ek8ub290ssxwo': 'multi-collection',
  'cmoih2a8u000fk8ubtwt4l56x': 'adult',
  'cmoih2a8u000gk8ub7h3g5nnc': 'educational',
  'cmoih2a8t000dk8ub19p3e6p1': 'gift-cards',
  'cmoih2a8v000ik8ubb4knqdgw': 'productivity',
  'cmoih2a8v000jk8ub7zu8dkou': 'cloud-storage',
  'cmoih2a8u000hk8ubax2xcwvb': 'gaming-topup',
  'cmoih2a8s000ck8ub1g0uubyg': 'design-creative',
  'cmoih2a8r000bk8ubycqlff44': 'ai-tools',
};

// Price updates by product slug
interface PriceUpdate {
  basePriceBDT: string;
  priceOptions: Array<{ label: string; priceBDT: string; priceRMB: string }>;
}

const PRICE_UPDATES: Record<string, PriceUpdate> = {
  // === Streaming ===
  'sony-liv': {
    basePriceBDT: '220',
    priceOptions: [
      { label: '1 Month', priceBDT: '220', priceRMB: '12.32' },
      { label: '3 Months', priceBDT: '600', priceRMB: '33.60' },
      { label: '12 Months', priceBDT: '2160', priceRMB: '120.96' },
    ],
  },
  'chorki': {
    basePriceBDT: '200',
    priceOptions: [
      { label: '1 Month', priceBDT: '200', priceRMB: '11.20' },
    ],
  },
  'viu': {
    basePriceBDT: '150',
    priceOptions: [
      { label: '1 Month', priceBDT: '150', priceRMB: '8.40' },
    ],
  },
  'hulu': {
    basePriceBDT: '450',
    priceOptions: [
      { label: '1 Month', priceBDT: '450', priceRMB: '25.20' },
    ],
  },
  'disney-plus': {
    basePriceBDT: '299',
    priceOptions: [
      { label: '1 Month', priceBDT: '299', priceRMB: '16.74' },
    ],
  },
  'plex-tv-movies': {
    basePriceBDT: '200',
    priceOptions: [
      { label: '1 Month', priceBDT: '200', priceRMB: '11.20' },
    ],
  },
  'discovery-plus': {
    basePriceBDT: '250',
    priceOptions: [
      { label: '1 Month', priceBDT: '250', priceRMB: '14.00' },
    ],
  },
  'bongo': {
    basePriceBDT: '150',
    priceOptions: [
      { label: '1 Month', priceBDT: '150', priceRMB: '8.40' },
    ],
  },
  'klikk': {
    basePriceBDT: '150',
    priceOptions: [
      { label: '1 Month', priceBDT: '150', priceRMB: '8.40' },
    ],
  },
  'showtime': {
    basePriceBDT: '350',
    priceOptions: [
      { label: '1 Month', priceBDT: '350', priceRMB: '19.60' },
    ],
  },
  'wwe': {
    basePriceBDT: '250',
    priceOptions: [
      { label: '1 Month', priceBDT: '250', priceRMB: '14.00' },
    ],
  },
  'pure-flix': {
    basePriceBDT: '200',
    priceOptions: [
      { label: '1 Month', priceBDT: '200', priceRMB: '11.20' },
    ],
  },
  'shadowz': {
    basePriceBDT: '200',
    priceOptions: [
      { label: '1 Month', priceBDT: '200', priceRMB: '11.20' },
    ],
  },
  'fubo-tv': {
    basePriceBDT: '400',
    priceOptions: [
      { label: '1 Month', priceBDT: '400', priceRMB: '22.40' },
    ],
  },

  // === AI Tools ===
  'midjourney': {
    basePriceBDT: '1200',
    priceOptions: [
      { label: 'Basic Plan', priceBDT: '800', priceRMB: '44.80' },
      { label: 'Standard Plan', priceBDT: '1200', priceRMB: '67.20' },
      { label: 'Pro Plan', priceBDT: '2400', priceRMB: '134.40' },
    ],
  },
  'leonardo-ai': {
    basePriceBDT: '800',
    priceOptions: [
      { label: '1 Month', priceBDT: '800', priceRMB: '44.80' },
    ],
  },
  'ideogram': {
    basePriceBDT: '700',
    priceOptions: [
      { label: '1 Month', priceBDT: '700', priceRMB: '39.20' },
    ],
  },
  'uizard-ai': {
    basePriceBDT: '900',
    priceOptions: [
      { label: '1 Month', priceBDT: '900', priceRMB: '50.40' },
    ],
  },
  'microsoft-copilot': {
    basePriceBDT: '1800',
    priceOptions: [
      { label: '1 Month', priceBDT: '1800', priceRMB: '100.80' },
    ],
  },
  'tabnine': {
    basePriceBDT: '1200',
    priceOptions: [
      { label: '1 Month', priceBDT: '1200', priceRMB: '67.20' },
    ],
  },
  'ninja-ai': {
    basePriceBDT: '800',
    priceOptions: [
      { label: '1 Month', priceBDT: '800', priceRMB: '44.80' },
    ],
  },
  'remini-ai': {
    basePriceBDT: '300',
    priceOptions: [
      { label: '1 Month', priceBDT: '300', priceRMB: '16.80' },
    ],
  },
  'chatgpt-plus': {
    basePriceBDT: '2500',
    priceOptions: [
      { label: '1 Month', priceBDT: '2500', priceRMB: '140.00' },
    ],
  },
  'ninjachatai': {
    basePriceBDT: '600',
    priceOptions: [
      { label: '1 Month', priceBDT: '600', priceRMB: '33.60' },
    ],
  },
  'jenni-ai': {
    basePriceBDT: '600',
    priceOptions: [
      { label: '1 Month', priceBDT: '600', priceRMB: '33.60' },
    ],
  },
  'fliki-ai': {
    basePriceBDT: '900',
    priceOptions: [
      { label: '1 Month', priceBDT: '900', priceRMB: '50.40' },
    ],
  },
  'pika-art-ai': {
    basePriceBDT: '700',
    priceOptions: [
      { label: '1 Month', priceBDT: '700', priceRMB: '39.20' },
    ],
  },
  'krea-ai': {
    basePriceBDT: '800',
    priceOptions: [
      { label: '1 Month', priceBDT: '800', priceRMB: '44.80' },
    ],
  },
  'vizard-ai': {
    basePriceBDT: '600',
    priceOptions: [
      { label: '1 Month', priceBDT: '600', priceRMB: '33.60' },
    ],
  },
  'character-ai': {
    basePriceBDT: '500',
    priceOptions: [
      { label: '1 Month', priceBDT: '500', priceRMB: '28.00' },
    ],
  },
  'vondy-ai': {
    basePriceBDT: '500',
    priceOptions: [
      { label: '1 Month', priceBDT: '500', priceRMB: '28.00' },
    ],
  },
  'resemble-ai': {
    basePriceBDT: '900',
    priceOptions: [
      { label: '1 Month', priceBDT: '900', priceRMB: '50.40' },
    ],
  },
  'humata-ai': {
    basePriceBDT: '600',
    priceOptions: [
      { label: '1 Month', priceBDT: '600', priceRMB: '33.60' },
    ],
  },
  'mister-horse-ai': {
    basePriceBDT: '500',
    priceOptions: [
      { label: '1 Month', priceBDT: '500', priceRMB: '28.00' },
    ],
  },
  'gamma-ai': {
    basePriceBDT: '500',
    priceOptions: [
      { label: '1 Month', priceBDT: '500', priceRMB: '28.00' },
    ],
  },
  'deepl-ai': {
    basePriceBDT: '800',
    priceOptions: [
      { label: '1 Month', priceBDT: '800', priceRMB: '44.80' },
    ],
  },
  'customgpt': {
    basePriceBDT: '1500',
    priceOptions: [
      { label: '1 Month', priceBDT: '1500', priceRMB: '84.00' },
    ],
  },

  // === Educational ===
  'coursera': {
    basePriceBDT: '3400',
    priceOptions: [
      { label: '1 Year', priceBDT: '3400', priceRMB: '190.40' },
    ],
  },
  'scribd': {
    basePriceBDT: '300',
    priceOptions: [
      { label: '1 Month', priceBDT: '300', priceRMB: '16.80' },
    ],
  },
  'audible-plus': {
    basePriceBDT: '250',
    priceOptions: [
      { label: '1 Month', priceBDT: '250', priceRMB: '14.00' },
    ],
  },
  'skillshare': {
    basePriceBDT: '600',
    priceOptions: [
      { label: '1 Year', priceBDT: '600', priceRMB: '33.60' },
    ],
  },
  'datacamp': {
    basePriceBDT: '800',
    priceOptions: [
      { label: '3 Months', priceBDT: '800', priceRMB: '44.80' },
    ],
  },
  'duolingo-super-plus': {
    basePriceBDT: '350',
    priceOptions: [
      { label: '1 Month', priceBDT: '350', priceRMB: '19.60' },
      { label: '6 Months', priceBDT: '1800', priceRMB: '100.80' },
    ],
  },
  'bookmate': {
    basePriceBDT: '200',
    priceOptions: [
      { label: '1 Month', priceBDT: '200', priceRMB: '11.20' },
    ],
  },
  'rakuten-kobo': {
    basePriceBDT: '250',
    priceOptions: [
      { label: '1 Month', priceBDT: '250', priceRMB: '14.00' },
    ],
  },

  // === Design & Creative ===
  'adobe-stock': {
    basePriceBDT: '600',
    priceOptions: [
      { label: '1 Month', priceBDT: '600', priceRMB: '33.60' },
    ],
  },
  'canva-pro': {
    basePriceBDT: '300',
    priceOptions: [
      { label: '1 Year', priceBDT: '300', priceRMB: '16.80' },
    ],
  },
  'getty-images': {
    basePriceBDT: '800',
    priceOptions: [
      { label: '1 Month', priceBDT: '800', priceRMB: '44.80' },
    ],
  },
  'filmora-13': {
    basePriceBDT: '600',
    priceOptions: [
      { label: '1 Year', priceBDT: '600', priceRMB: '33.60' },
      { label: 'Lifetime', priceBDT: '1200', priceRMB: '67.20' },
    ],
  },
  'beautiful-ai': {
    basePriceBDT: '500',
    priceOptions: [
      { label: '12 Months', priceBDT: '500', priceRMB: '28.00' },
    ],
  },

  // === Productivity ===
  'microsoft-office-365': {
    basePriceBDT: '800',
    priceOptions: [
      { label: '1 Year Personal', priceBDT: '800', priceRMB: '44.80' },
      { label: '1 Year Family', priceBDT: '1200', priceRMB: '67.20' },
    ],
  },
  'zoom-pro': {
    basePriceBDT: '600',
    priceOptions: [
      { label: '1 Month', priceBDT: '600', priceRMB: '33.60' },
    ],
  },
};

async function main() {
  console.log('🔄 Starting database update script...\n');

  const products = await prisma.product.findMany({
    select: { id: true, slug: true, categoryId: true, basePriceBDT: true, image: true },
  });

  let pricesUpdated = 0;
  let imagesUpdated = 0;
  let priceErrors = 0;
  let imageErrors = 0;

  // === Phase 1: Update prices ===
  console.log('💰 Updating product prices...');
  for (const product of products) {
    const priceUpdate = PRICE_UPDATES[product.slug];
    if (!priceUpdate) continue;

    try {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          basePriceBDT: priceUpdate.basePriceBDT,
          priceOptions: JSON.stringify(priceUpdate.priceOptions),
        },
      });
      pricesUpdated++;
      console.log(`  ✅ ${product.slug}: BDT ${priceUpdate.basePriceBDT} (${priceUpdate.priceOptions.length} options)`);
    } catch (error: any) {
      priceErrors++;
      console.error(`  ❌ ${product.slug}: ${error.message}`);
    }
  }

  // === Phase 2: Update images ===
  console.log('\n🖼️  Updating product images...');
  for (const product of products) {
    let imagePath: string;

    if (PRODUCT_IMAGES.has(product.slug)) {
      imagePath = `/images/products/${product.slug}.png`;
    } else {
      const categorySlug = CATEGORY_SLUG_MAP[product.categoryId];
      if (categorySlug) {
        imagePath = `/images/categories/${categorySlug}.png`;
      } else {
        console.log(`  ⚠️  ${product.slug}: Unknown category ${product.categoryId}, skipping image`);
        continue;
      }
    }

    try {
      await prisma.product.update({
        where: { id: product.id },
        data: { image: imagePath },
      });
      imagesUpdated++;
      console.log(`  ✅ ${product.slug}: ${imagePath}`);
    } catch (error: any) {
      imageErrors++;
      console.error(`  ❌ ${product.slug}: ${error.message}`);
    }
  }

  // === Phase 3: Update multi-collection variants with prices ===
  // These are the "-multi" variants in the multi-collection category
  const multiUpdates: Record<string, PriceUpdate> = {
    'viu-multi': {
      basePriceBDT: '150',
      priceOptions: [
        { label: '1 Month', priceBDT: '150', priceRMB: '8.40' },
      ],
    },
    'scribd-multi': {
      basePriceBDT: '300',
      priceOptions: [
        { label: '1 Month', priceBDT: '300', priceRMB: '16.80' },
      ],
    },
    'remini-multi': {
      basePriceBDT: '300',
      priceOptions: [
        { label: '1 Month', priceBDT: '300', priceRMB: '16.80' },
      ],
    },
    'freepik-multi': {
      basePriceBDT: '550',
      priceOptions: [
        { label: 'Basic', priceBDT: '550', priceRMB: '30.80' },
        { label: 'Standard', priceBDT: '800', priceRMB: '44.80' },
        { label: 'Premium', priceBDT: '1500', priceRMB: '84.00' },
      ],
    },
    'quillbot-multi': {
      basePriceBDT: '400',
      priceOptions: [
        { label: '1 Month', priceBDT: '400', priceRMB: '22.40' },
      ],
    },
    'kobo-multi': {
      basePriceBDT: '250',
      priceOptions: [
        { label: '1 Month', priceBDT: '250', priceRMB: '14.00' },
      ],
    },
    'imdb-multi': {
      basePriceBDT: '250',
      priceOptions: [
        { label: '1 Month', priceBDT: '250', priceRMB: '14.00' },
      ],
    },
    'turnitin': {
      basePriceBDT: '500',
      priceOptions: [
        { label: '1 Check', priceBDT: '500', priceRMB: '28.00' },
      ],
    },
    'idm-pro': {
      basePriceBDT: '400',
      priceOptions: [
        { label: '1 Year', priceBDT: '400', priceRMB: '22.40' },
      ],
    },
    'elevenlabs': {
      basePriceBDT: '800',
      priceOptions: [
        { label: '1 Month', priceBDT: '800', priceRMB: '44.80' },
      ],
    },
    'deezer-music': {
      basePriceBDT: '250',
      priceOptions: [
        { label: '1 Month', priceBDT: '250', priceRMB: '14.00' },
      ],
    },
    'prime-gaming': {
      basePriceBDT: '300',
      priceOptions: [
        { label: '1 Month', priceBDT: '300', priceRMB: '16.80' },
      ],
    },
    'super-duolingo': {
      basePriceBDT: '350',
      priceOptions: [
        { label: '1 Month', priceBDT: '350', priceRMB: '19.60' },
      ],
    },
  };

  console.log('\n📦 Updating multi-collection and remaining products...');
  for (const product of products) {
    const multiUpdate = multiUpdates[product.slug];
    if (!multiUpdate) continue;

    // Skip if already updated in Phase 1
    if (PRICE_UPDATES[product.slug]) continue;

    try {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          basePriceBDT: multiUpdate.basePriceBDT,
          priceOptions: JSON.stringify(multiUpdate.priceOptions),
        },
      });
      pricesUpdated++;
      console.log(`  ✅ ${product.slug}: BDT ${multiUpdate.basePriceBDT} (${multiUpdate.priceOptions.length} options)`);
    } catch (error: any) {
      priceErrors++;
      console.error(`  ❌ ${product.slug}: ${error.message}`);
    }
  }

  // === Summary ===
  console.log('\n' + '='.repeat(50));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(50));
  console.log(`💰 Prices updated: ${pricesUpdated}`);
  console.log(`🖼️  Images updated: ${imagesUpdated}`);
  console.log(`❌ Price errors: ${priceErrors}`);
  console.log(`❌ Image errors: ${imageErrors}`);

  // === Verify: show remaining products without numeric prices ===
  const remaining = await prisma.product.findMany({
    where: {
      OR: [
        { basePriceBDT: 'Inbox Price' },
        { basePriceBDT: 'Cheap' },
        { basePriceBDT: 'Market Challenge' },
        { basePriceBDT: 'Market Lowest' },
        { basePriceBDT: 'Lowest' },
        { basePriceBDT: 'Low Price' },
        { basePriceBDT: 'Custom' },
      ],
    },
    select: { slug: true, name: true, basePriceBDT: true, image: true },
  });

  if (remaining.length > 0) {
    console.log('\n⚠️  Products still without numeric prices:');
    for (const p of remaining) {
      console.log(`  - ${p.slug} (${p.name}): ${p.basePriceBDT} | image: ${p.image || 'none'}`);
    }
  } else {
    console.log('\n✅ All products now have numeric prices!');
  }

  // === Verify: show products without images ===
  const noImage = await prisma.product.findMany({
    where: { image: null },
    select: { slug: true, name: true },
  });

  if (noImage.length > 0) {
    console.log('\n⚠️  Products still without images:');
    for (const p of noImage) {
      console.log(`  - ${p.slug} (${p.name})`);
    }
  } else {
    console.log('\n✅ All products now have image paths!');
  }

  await prisma.$disconnect();
  console.log('\n🎉 Update complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
