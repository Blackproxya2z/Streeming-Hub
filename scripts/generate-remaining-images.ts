import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/public/images/products';
const CONCURRENCY = 5;

const productImages = [
  { slug: 'clash-of-clans-gems', prompt: 'Clash of Clans game app icon, yellow gems on green, professional 3D app icon style, high quality' },
  { slug: 'cod-topup', prompt: 'Call of Duty Mobile game app icon, black and green logo, professional 3D app icon style, high quality' },
  { slug: 'efootball-topup', prompt: 'eFootball game app icon, blue and white soccer logo, professional 3D app icon style, high quality' },
  { slug: 'fc-coin-topup', prompt: 'EA FC Coin game app icon, blue and gold logo, professional 3D app icon style, high quality' },
  { slug: 'viu', prompt: 'Viu streaming app icon, orange and white logo, professional 3D app icon style, high quality' },
  { slug: 'scribd-pro', prompt: 'Scribd reading app icon, red and white logo, professional 3D app icon style, high quality' },
  { slug: 'remini-pro', prompt: 'Remini photo enhancer app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'freepik-premium', prompt: 'Freepik design app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'turnitin', prompt: 'Turnitin plagiarism checker app icon, red and white logo, professional 3D app icon style, high quality' },
  { slug: 'quillbot-premium', prompt: 'QuillBot AI writing app icon, green and white logo, professional 3D app icon style, high quality' },
  { slug: 'idm-pro', prompt: 'IDM download manager app icon, green and blue logo, professional 3D app icon style, high quality' },
  { slug: 'imdb-pro', prompt: 'IMDb Pro app icon, yellow and black logo, professional 3D app icon style, high quality' },
  { slug: 'elevenlabs', prompt: 'ElevenLabs AI voice app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'deezer-music', prompt: 'Deezer music streaming app icon, purple and white logo, professional 3D app icon style, high quality' },
  { slug: 'rakuten-kobo', prompt: 'Rakuten Kobo reading app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'prime-gaming', prompt: 'Prime Gaming app icon, orange and purple logo, professional 3D app icon style, high quality' },
  { slug: 'super-duolingo', prompt: 'Super Duolingo app icon, green and gold owl logo, professional 3D app icon style, high quality' },
  { slug: 'coursera-edu', prompt: 'Coursera education app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'audible-plus', prompt: 'Audible audiobook app icon, orange and white logo, professional 3D app icon style, high quality' },
  { slug: 'quizlet-plus', prompt: 'Quizlet study app icon, purple and white logo, professional 3D app icon style, high quality' },
  { slug: 'course-hero', prompt: 'Course Hero education app icon, red and gold logo, professional 3D app icon style, high quality' },
  { slug: 'skillshare', prompt: 'Skillshare learning app icon, green and white logo, professional 3D app icon style, high quality' },
  { slug: 'datacamp', prompt: 'DataCamp data science app icon, green and white logo, professional 3D app icon style, high quality' },
  { slug: 'duolingo-super', prompt: 'Duolingo Super app icon, green owl logo, professional 3D app icon style, high quality' },
  { slug: 'bookmate', prompt: 'Bookmate reading app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'adobe-stock', prompt: 'Adobe Stock app icon, blue and white A logo, professional 3D app icon style, high quality' },
  { slug: 'istock', prompt: 'iStock by Getty Images app icon, red and white logo, professional 3D app icon style, high quality' },
  { slug: 'getty-images', prompt: 'Getty Images app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'filmora-13', prompt: 'Filmora 13 video editor app icon, dark and green logo, professional 3D app icon style, high quality' },
  { slug: 'beautiful-ai', prompt: 'Beautiful.ai presentation app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'autodesk', prompt: 'Autodesk design app icon, red and white logo, professional 3D app icon style, high quality' },
  { slug: 'autocad', prompt: 'AutoCAD design app icon, red and white A logo, professional 3D app icon style, high quality' },
  { slug: 'bootstrap-studio', prompt: 'Bootstrap Studio web design app icon, purple and white logo, professional 3D app icon style, high quality' },
  { slug: 'browserstack', prompt: 'BrowserStack testing app icon, orange and white logo, professional 3D app icon style, high quality' },
  { slug: 'zoom-pro', prompt: 'Zoom Pro video call app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'tradingview', prompt: 'TradingView finance app icon, dark and blue logo, professional 3D app icon style, high quality' },
  { slug: 'calm-premium', prompt: 'Calm meditation app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'telegram-premium', prompt: 'Telegram Premium app icon, blue and white paper plane logo with star, professional 3D app icon style, high quality' },
];

async function generateSingleImage(
  zai: any,
  item: { slug: string; prompt: string }
): Promise<{ slug: string; success: boolean; error?: string }> {
  const outputPath = path.join(OUTPUT_DIR, `${item.slug}.png`);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await zai.images.generations.create({
        prompt: item.prompt,
        size: '1024x1024'
      });
      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      return { slug: item.slug, success: true };
    } catch (error: any) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1500));
      } else {
        return { slug: item.slug, success: false, error: error.message };
      }
    }
  }
  return { slug: item.slug, success: false, error: 'Max retries' };
}

async function generateImages() {
  const zai = await ZAI.create();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Filter out images that already exist
  const toGenerate = productImages.filter(item => {
    const outputPath = path.join(OUTPUT_DIR, `${item.slug}.png`);
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping ${item.slug} (already exists)`);
      return false;
    }
    return true;
  });

  const skipped = productImages.length - toGenerate.length;
  let generated = 0;
  let failed = 0;
  const failedList: string[] = [];

  console.log(`\n🎨 Generating ${toGenerate.length} images (${skipped} skipped), concurrency=${CONCURRENCY}...\n`);

  // Process in batches of CONCURRENCY
  for (let i = 0; i < toGenerate.length; i += CONCURRENCY) {
    const batch = toGenerate.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(toGenerate.length / CONCURRENCY);
    console.log(`📦 Batch ${batchNum}/${totalBatches}: ${batch.map(b => b.slug).join(', ')}`);

    const results = await Promise.all(
      batch.map(item => generateSingleImage(zai, item))
    );

    for (const result of results) {
      if (result.success) {
        generated++;
        console.log(`  ✅ ${result.slug}`);
      } else {
        failed++;
        failedList.push(result.slug);
        console.error(`  ❌ ${result.slug}: ${result.error}`);
      }
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Generated: ${generated}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Failed:   ${failed}`);
  if (failedList.length > 0) {
    console.log(`   Failed: ${failedList.join(', ')}`);
  }
}

generateImages().catch(console.error);
