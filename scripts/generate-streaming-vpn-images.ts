import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/public/images/products';

const products = [
  // Streaming/OTT
  { slug: 'sony-liv', prompt: 'Sony LIV streaming app icon, red and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'hoichoi', prompt: 'Hoichoi Bengali streaming app icon, orange logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'chorki', prompt: 'Chorki Bangladeshi streaming app icon, purple logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'hulu', prompt: 'Hulu streaming app icon, green and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'plex-tv', prompt: 'Plex streaming app icon, orange and black logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'discovery-plus', prompt: 'Discovery Plus streaming app icon, blue and green logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'bongo', prompt: 'Bongo streaming app icon, red logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'klikk', prompt: 'KLIKK streaming app icon, modern dark branding, professional 3D app icon style, high quality' },
  { slug: 'showtime', prompt: 'Showtime streaming app icon, red and white logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'wwe-network', prompt: 'WWE Network app icon, red and black logo, professional 3D app icon style, high quality' },
  { slug: 'fubo-tv', prompt: 'Fubo TV streaming app icon, red and blue logo, professional 3D app icon style, high quality' },
  { slug: 'jio-cinema', prompt: 'Jio Cinema streaming app icon, blue and pink logo, professional 3D app icon style, high quality' },

  // VPN
  { slug: 'nordvpn', prompt: 'Nord secure connection app icon, blue mountain peak logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'expressvpn', prompt: 'Express secure connection app icon, red logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'surfshark-vpn', prompt: 'Surfshark VPN app icon, cyan shark logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'cyberghost-vpn', prompt: 'CyberGhost VPN app icon, yellow ghost logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'windscribe-vpn', prompt: 'Windscribe VPN app icon, green logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'proton-vpn', prompt: 'ProtonVPN app icon, blue logo on dark background, professional 3D app icon style, high quality' },
  { slug: 'pia-vpn', prompt: 'Private Internet Access VPN app icon, green robot logo, professional 3D app icon style, high quality' },
  { slug: 'ipvanish-vpn', prompt: 'IPVanish VPN app icon, green and black logo, professional 3D app icon style, high quality' },
  { slug: 'vypr-vpn', prompt: 'VyprVPN app icon, golden frog logo, professional 3D app icon style, high quality' },
  { slug: 'hma-vpn', prompt: 'HMA VPN app icon, yellow and black logo, professional 3D app icon style, high quality' },
  { slug: 'avg-vpn', prompt: 'AVG Secure VPN app icon, green and white logo, professional 3D app icon style, high quality' },
  { slug: 'nolag-vpn', prompt: 'NoLag VPN gaming app icon, blue and white logo, professional 3D app icon style, high quality' },
  { slug: 'seed4me-vpn', prompt: 'Seed4Me VPN app icon, green leaf logo, professional 3D app icon style, high quality' },
  { slug: 'avast-vpn', prompt: 'Avast SecureLine VPN app icon, orange logo, professional 3D app icon style, high quality' },
  { slug: 'hotspot-shield-vpn', prompt: 'Hotspot Shield VPN app icon, red and blue shield logo, professional 3D app icon style, high quality' },
];

async function generateImages() {
  const zai = await ZAI.create();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  const toGenerate = products.filter(item => {
    const outputPath = path.join(OUTPUT_DIR, `${item.slug}.png`);
    if (fs.existsSync(outputPath)) {
      console.log(`  ⏭️  Skipping ${item.slug} (already exists)`);
      skipped++;
      return false;
    }
    return true;
  });

  console.log(`\n🎨 ${toGenerate.length} images to generate, ${skipped} skipped (already exist)\n`);

  for (const item of toGenerate) {
    const outputPath = path.join(OUTPUT_DIR, `${item.slug}.png`);
    try {
      console.log(`  🔄 Generating ${item.slug}...`);
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

  console.log(`\n📊 Results: ${generated} generated, ${skipped} skipped, ${failed} failed`);
}

generateImages().catch(console.error);
