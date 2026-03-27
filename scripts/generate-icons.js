#!/usr/bin/env node
/**
 * Generates PWA icons (192×192 and 512×512 PNG) from an inline SVG.
 * Run once after cloning: node scripts/generate-icons.js
 * Requires: sharp (installed as devDependency)
 */

import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");

// SVG source — pink heart on warm cream background
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#FDF6F0"/>
  <text y="340" x="256" text-anchor="middle" font-size="320" font-family="sans-serif">💗</text>
</svg>
`;

const svgBuf = Buffer.from(svg);

await mkdir(outDir, { recursive: true });

for (const size of [192, 512]) {
  const outPath = join(outDir, `icon-${size}.png`);
  await sharp(svgBuf).resize(size, size).png().toFile(outPath);
  console.log(`✓ Generated ${outPath}`);
}

console.log("Icons ready in public/icons/");
