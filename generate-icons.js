// Generate placeholder icons for the Chrome extension
// Run with: node generate-icons.js

const fs = require('fs');

// Simple PNG generator using data URLs
function generateIconSVG(size) {
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)"/>
      <rect x="${size * 0.2}" y="${size * 0.3}" width="${size * 0.6}" height="${size * 0.5}" fill="white" rx="${size * 0.05}"/>
      <circle cx="${size * 0.5}" cy="${size * 0.55}" r="${size * 0.15}" fill="#357ABD"/>
      <rect x="${size * 0.35}" y="${size * 0.25}" width="${size * 0.15}" height="${size * 0.08}" fill="white" rx="${size * 0.02}"/>
    </svg>
  `.trim();
}

console.log('Generating icons...');

// For now, just create the SVG files
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = generateIconSVG(size);
  const filename = `icon${size}.svg`;
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('\nNote: Chrome extensions prefer PNG files.');
console.log('You have two options:');
console.log('1. Use an online SVG to PNG converter for the generated SVG files');
console.log('2. Install canvas package: npm install canvas');
console.log('   Then we can generate PNG files directly');
