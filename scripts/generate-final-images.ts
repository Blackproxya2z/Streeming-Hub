import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/public/images/products';

const productImages = [
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

async function generateImages() {
  const zai = await ZAI.create();

  const toGenerate = productImages.filter(item => {
    const outputPath = path.join(OUTPUT_DIR, `${item.slug}.png`);
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping ${item.slug}`);
      return false;
    }
    return true;
  });

  let generated = 0;
  let failed = 0;
  const failedList: string[] = [];

  console.log(`\n🎨 Generating ${toGenerate.length} images with concurrency=4...\n`);

  for (let i = 0; i < toGenerate.length; i += 4) {
    const batch = toGenerate.slice(i, i + 4);
    console.log(`📦 Batch: ${batch.map(b => b.slug).join(', ')}`);

    const results = await Promise.all(
      batch.map(async (item) => {
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
            if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
            else return { slug: item.slug, success: false, error: error.message };
          }
        }
        return { slug: item.slug, success: false, error: 'Max retries' };
      })
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

  console.log(`\n📊 Results: ✅ ${generated} generated, ❌ ${failed} failed`);
  if (failedList.length > 0) console.log(`   Failed: ${failedList.join(', ')}`);
}

generateImages().catch(console.error);
