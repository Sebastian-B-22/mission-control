import sharp from "sharp";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

async function generatePreviews() {
  console.log("Generating icon previews...\n");

  for (let i = 1; i <= 4; i++) {
    const svgPath = path.join(publicDir, `icon-option${i}.svg`);
    const pngPath = path.join(publicDir, `preview-option${i}.png`);

    if (existsSync(svgPath)) {
      await sharp(svgPath).resize(180, 180).png().toFile(pngPath);
      console.log(`✓ Generated preview-option${i}.png`);
    }
  }

  console.log("\nPreviews generated! Check /public/preview-option1-4.png");
}

generatePreviews().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
