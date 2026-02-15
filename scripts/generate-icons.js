const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#f59e0b"/>
  <text
    x="50%"
    y="50%"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="320"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    dominant-baseline="central"
  >M</text>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');

async function generateIcons() {
  console.log('Generating icons...');

  // Generate 180x180 for Apple
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-icon.png'));
  console.log('✓ Generated apple-icon.png (180x180)');

  // Generate 192x192 for PWA
  await sharp(Buffer.from(svgIcon))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Generated icon-192.png (192x192)');

  // Generate 512x512 for PWA
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Generated icon-512.png (512x512)');

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
