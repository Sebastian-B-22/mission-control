const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

async function generatePreviews() {
  console.log('Generating icon previews...\n');

  for (let i = 1; i <= 4; i++) {
    const svgPath = path.join(publicDir, `icon-option${i}.svg`);
    const pngPath = path.join(publicDir, `preview-option${i}.png`);
    
    if (fs.existsSync(svgPath)) {
      await sharp(svgPath)
        .resize(180, 180)
        .png()
        .toFile(pngPath);
      console.log(`✓ Generated preview-option${i}.png`);
    }
  }

  console.log('\nPreviews generated! Check /public/preview-option1-4.png');
}

generatePreviews().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
