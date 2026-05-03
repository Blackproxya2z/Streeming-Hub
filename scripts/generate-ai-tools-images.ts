import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/public/images/products';

const products = [
  { slug: 'jarvis-ai', prompt: 'Jarvis AI assistant app icon, blue and white futuristic logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'autoshorts-ai', prompt: 'AutoShorts AI video app icon, purple and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'leonardo-ai', prompt: 'Leonardo AI art app icon, orange and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'ideogram-ai', prompt: 'Ideogram AI image app icon, blue and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'uizard-ai', prompt: 'Uizard AI design app icon, purple and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'microsoft-copilot', prompt: 'Microsoft Copilot AI app icon, blue and purple gradient logo, professional 3D app icon style, high quality' },
  { slug: 'tabnine', prompt: 'Tabnine AI coding app icon, blue and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'ninja-ai', prompt: 'Ninja AI assistant app icon, red and black logo, professional 3D app icon style, high quality' },
  { slug: 'remini-ai', prompt: 'Remini AI photo enhancer app icon, blue and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'ninjachat-ai', prompt: 'NinjaChat AI chat app icon, purple and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'jenni-ai', prompt: 'Jenni AI writing app icon, purple and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'fliki-ai', prompt: 'Fliki AI video app icon, blue and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'pika-art-ai', prompt: 'Pika Art AI video app icon, yellow and black logo, professional 3D app icon style, high quality' },
  { slug: 'krea-ai', prompt: 'Krea AI design app icon, purple and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'vizard-ai', prompt: 'Vizard AI video app icon, blue and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'character-ai', prompt: 'Character AI chat app icon, orange and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'vondy-ai', prompt: 'Vondy AI app icon, blue and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'resemble-ai', prompt: 'Resemble AI voice app icon, green and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'humata-ai', prompt: 'Humata AI document app icon, blue and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'mister-horse-ai', prompt: 'Mister Horse AI animation app icon, orange and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'gamma-ai', prompt: 'Gamma AI presentation app icon, purple and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'deepl-ai', prompt: 'DeepL AI translation app icon, blue and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'custom-gpt', prompt: 'CustomGPT AI app icon, green and white logo on dark background, professional 3D app icon style, high quality' },
];

async function generateAiToolsImages() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const zai = await ZAI.create();

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  console.log(`\n🎨 Generating ${products.length} AI Tools product images...\n`);

  for (const item of products) {
    const outputPath = path.join(OUTPUT_DIR, `${item.slug}.png`);

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping ${item.slug} (already exists)`);
      skipped++;
      continue;
    }

    try {
      console.log(`  🔄 Generating ${item.slug}...`);
      const response = await zai.images.generations.create({
        prompt: item.prompt,
        size: '1024x1024',
      });

      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      generated++;
      console.log(`  ✅ ${item.slug}`);
    } catch (error: any) {
      failed++;
      const msg = `${item.slug}: ${error.message || error}`;
      errors.push(msg);
      console.error(`  ❌ ${msg}`);
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   ✅ Generated: ${generated}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Failed:   ${failed}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach(e => console.log(`   - ${e}`));
  }

  console.log(`\n🎉 Done! ${generated + skipped}/${products.length} images available.`);
}

generateAiToolsImages().catch(console.error);
