import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/public/images';

const categoryImages = [
  { slug: 'streaming', prompt: 'A modern entertainment hub with floating screens showing movies and TV shows, neon glow effect, dark background with red and purple gradients, digital streaming concept, professional 3D render, high quality' },
  { slug: 'ai-tools', prompt: 'Futuristic AI brain made of glowing neural network connections, purple and blue holographic effect, dark background, artificial intelligence concept, professional 3D render, high quality' },
  { slug: 'educational', prompt: 'Open glowing book with digital light particles rising, graduation cap, modern e-learning concept, blue and gold color scheme, dark background, professional 3D render, high quality' },
  { slug: 'design-creative', prompt: 'Creative design tools floating in space - paintbrush, color palette, pen tool, with colorful paint splashes, pink and magenta gradients, dark background, professional 3D render, high quality' },
  { slug: 'productivity', prompt: 'Modern workspace with floating holographic charts, calendar, and documents, amber and orange glow, dark background, productivity and business concept, professional 3D render, high quality' },
  { slug: 'cloud-storage', prompt: 'Glowing cloud with data streams and connected devices, sky blue and white color scheme, digital cloud storage concept, dark background, professional 3D render, high quality' },
  { slug: 'vpn', prompt: 'Shield with digital lock and secure connection lines, emerald green glow, cybersecurity and VPN concept, dark background, professional 3D render, high quality' },
  { slug: 'gift-cards', prompt: 'Stack of colorful gift cards with ribbons and golden sparkles, amber and yellow warm glow, dark background, digital gift card concept, professional 3D render, high quality' },
  { slug: 'gaming-topup', prompt: 'Gaming controller with neon energy effects, purple and indigo gradients, floating game icons, dark background, gaming top-up concept, professional 3D render, high quality' },
  { slug: 'multi-collection', prompt: 'Collage of various digital services icons floating in a vortex, multiple colors, dark background, multi-service collection concept, professional 3D render, high quality' },
  { slug: 'adult', prompt: 'Red velvet curtain with golden 18+ badge, dramatic lighting, dark background, age-restricted content concept, professional 3D render, high quality' },
];

const productImages = [
  { slug: 'netflix', prompt: 'Netflix streaming interface on a dark screen, red glow, cinematic feel, professional mockup, high quality' },
  { slug: 'youtube-premium', prompt: 'YouTube Premium logo concept with red play button and music notes, dark background, professional 3D render, high quality' },
  { slug: 'amazon-prime-video', prompt: 'Amazon Prime Video blue play button with movie film strip, dark background, professional 3D render, high quality' },
  { slug: 'hotstar', prompt: 'Disney+ Hotstar streaming app with blue and purple glow, cricket and movies concept, dark background, professional mockup, high quality' },
  { slug: 'crunchyroll', prompt: 'Anime streaming interface with orange and white colors, Japanese animation concept, dark background, professional 3D render, high quality' },
  { slug: 'chatgpt-plus', prompt: 'ChatGPT AI interface with glowing text and conversation bubbles, teal and green colors, dark background, professional 3D render, high quality' },
  { slug: 'google-gemini-ai', prompt: 'Google Gemini AI with star sparkle and blue gradient, 2TB cloud storage concept, dark background, professional 3D render, high quality' },
  { slug: 'perplexity-ai-pro', prompt: 'Perplexity AI search interface with glowing results, blue and teal colors, dark background, professional 3D render, high quality' },
  { slug: 'cursor-ai', prompt: 'Cursor AI code editor with glowing code and AI suggestions, purple and blue colors, dark background, professional 3D render, high quality' },
  { slug: 'midjourney', prompt: 'Midjourney AI art generation interface with colorful generated images, artistic concept, dark background, professional 3D render, high quality' },
  { slug: 'grammarly-premium', prompt: 'Grammarly writing assistant with green checkmarks and text editing, dark background, professional 3D render, high quality' },
  { slug: 'coursera-plus', prompt: 'Coursera online learning platform with graduation cap and course cards, blue color scheme, dark background, professional 3D render, high quality' },
  { slug: 'adobe-creative-cloud', prompt: 'Adobe Creative Cloud with colorful app icons floating, red Creative Cloud logo, dark background, professional 3D render, high quality' },
  { slug: 'canva-pro', prompt: 'Canva design interface with colorful templates and tools, purple and teal colors, dark background, professional 3D render, high quality' },
  { slug: 'microsoft-office-365', prompt: 'Microsoft 365 apps floating with orange and blue colors, Word Excel PowerPoint icons, dark background, professional 3D render, high quality' },
  { slug: 'nordvpn', prompt: 'NordVPN shield with secure connection tunnel, blue and white colors, cybersecurity concept, dark background, professional 3D render, high quality' },
  { slug: 'figma-professional', prompt: 'Figma design tool interface with layers and components, purple and orange colors, dark background, professional 3D render, high quality' },
  { slug: 'capcut-pro', prompt: 'CapCut video editor interface with timeline and effects, dark theme with teal accents, professional 3D render, high quality' },
  { slug: 'disney-plus', prompt: 'Disney+ streaming with blue castle and starlit sky, Marvel and Star Wars icons, dark background, professional 3D render, high quality' },
  { slug: 'hulu', prompt: 'Hulu streaming interface with green glow, TV and movie concept, dark background, professional 3D render, high quality' },
  { slug: 'sony-liv', prompt: 'SonyLIV streaming app with purple glow, sports and entertainment concept, dark background, professional 3D render, high quality' },
  { slug: 'hoichoi', prompt: 'Hoichoi Bengali streaming with green and gold colors, Bengali entertainment concept, dark background, professional 3D render, high quality' },
  { slug: 'skillshare', prompt: 'Skillshare learning platform with green color, creative courses concept, dark background, professional 3D render, high quality' },
  { slug: 'freepik', prompt: 'Freepik design resources with colorful vectors and graphics, dark background, professional 3D render, high quality' },
  { slug: 'google-one', prompt: 'Google One cloud storage with blue and green colors, 2TB storage concept, dark background, professional 3D render, high quality' },
  { slug: 'expressvpn', prompt: 'ExpressVPN with red and white colors, secure connection concept, dark background, professional 3D render, high quality' },
  { slug: 'jarvis-ai', prompt: 'Jarvis AI assistant with futuristic holographic interface, blue and orange colors, dark background, professional 3D render, high quality' },
  { slug: 'autoshorts-ai', prompt: 'AutoShorts AI video creation tool with YouTube integration, dark background, professional 3D render, high quality' },
  { slug: 'tradingview', prompt: 'TradingView chart with green and red candlesticks, financial trading concept, dark background, professional 3D render, high quality' },
];

async function generateImages() {
  const zai = await ZAI.create();

  for (const dir of ['categories', 'products']) {
    const dirPath = path.join(OUTPUT_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  let generated = 0;
  let failed = 0;

  console.log(`\n🎨 Generating ${categoryImages.length} category images...`);
  for (const item of categoryImages) {
    const outputPath = path.join(OUTPUT_DIR, 'categories', `${item.slug}.png`);
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping ${item.slug} (already exists)`);
      generated++;
      continue;
    }
    try {
      const response = await zai.images.generations.create({
        prompt: item.prompt,
        size: '1024x1024'
      });
      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      generated++;
      console.log(`  ✅ ${item.slug}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ ${item.slug}: ${error.message}`);
    }
  }

  console.log(`\n🎨 Generating ${productImages.length} product images...`);
  for (const item of productImages) {
    const outputPath = path.join(OUTPUT_DIR, 'products', `${item.slug}.png`);
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping ${item.slug} (already exists)`);
      generated++;
      continue;
    }
    try {
      const response = await zai.images.generations.create({
        prompt: item.prompt,
        size: '1024x1024'
      });
      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      generated++;
      console.log(`  ✅ ${item.slug}`);
    } catch (error: any) {
      failed++;
      console.error(`  ❌ ${item.slug}: ${error.message}`);
    }
  }

  console.log(`\n📊 Results: ${generated} generated, ${failed} failed`);
}

generateImages().catch(console.error);
