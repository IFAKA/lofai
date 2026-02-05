#!/usr/bin/env node

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// SVG content for the icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0a0a0f"/>
  <circle cx="256" cy="256" r="120" fill="#7b68ee" opacity="0.3"/>
  <path d="M220 180v152c-8-8-20-12-32-12-26.5 0-48 21.5-48 48s21.5 48 48 48 48-21.5 48-48V228h64v-48h-80z" fill="#7b68ee"/>
</svg>`;

async function generateIcons() {
  console.log('Generating PNG icons...');

  // Generate 192x192 icon
  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'));
  console.log('✓ Generated icon-192.png');

  // Generate 512x512 icon
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'));
  console.log('✓ Generated icon-512.png');

  // Generate favicon (32x32)
  await sharp(Buffer.from(svgContent))
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('✓ Generated favicon.png');

  // Generate Apple touch icon (180x180)
  await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
