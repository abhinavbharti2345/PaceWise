import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 1. Full-bleed maskable SVG (safe zone is inner circle ~60-70% diameter)
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#FF453A" />
  <text x="256" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Outfit', 'Inter', sans-serif" font-weight="900" font-size="280" fill="#FFFFFF" text-anchor="middle">P</text>
</svg>
`;

// 2. Crisp Rounded "Any" Icon SVG with subtle rounded corners
const anySvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#FF453A" />
  <text x="256" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Outfit', 'Inter', sans-serif" font-weight="900" font-size="280" fill="#FFFFFF" text-anchor="middle">P</text>
</svg>
`;

// 3. Apple Touch Icon (180x180) SVG
const appleSvg = `
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" fill="#FF453A" />
  <text x="90" y="120" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Outfit', 'Inter', sans-serif" font-weight="900" font-size="98" fill="#FFFFFF" text-anchor="middle">P</text>
</svg>
`;

// 4. Favicon SVG
const faviconSvg = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="16" fill="#FF453A" />
  <text x="32" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Outfit', 'Inter', sans-serif" font-weight="900" font-size="36" fill="#FFFFFF" text-anchor="middle">P</text>
</svg>
`;

async function generateIcons() {
  const publicDir = path.resolve('public');

  // Save favicon.svg
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg.trim());

  // 1. icon-512.png (any)
  await sharp(Buffer.from(anySvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 2. icon-192.png (any)
  await sharp(Buffer.from(anySvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 3. icon-maskable-512.png (maskable)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));

  // 4. icon-maskable-192.png (maskable)
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));

  // 5. apple-touch-icon.png
  await sharp(Buffer.from(appleSvg))
    .resize(180, 180)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Successfully generated all crisp PWA icons!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
