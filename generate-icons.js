// Generate professional icons for the Chrome extension
// Run with: node generate-icons.js

const fs = require('fs');

// Generate detailed SVG icon for screenshot extension
function generateIconSVG(size) {
  const scale = size / 128;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="screenGrad${size}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#E8F4FD;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#D2E9FC;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background circle -->
      <circle cx="${size/2}" cy="${size/2}" r="${size*0.47}" fill="url(#bgGrad${size})" stroke="#2E6DA4" stroke-width="${scale*2}"/>

      <!-- Camera/monitor outline -->
      <rect x="${size*0.156}" y="${size*0.195}" width="${size*0.688}" height="${size*0.469}" rx="${size*0.031}"
            fill="url(#screenGrad${size})" stroke="#2E6DA4" stroke-width="${scale*2}"/>

      <!-- Screen content representing scrollable content -->
      <rect x="${size*0.219}" y="${size*0.258}" width="${size*0.562}" height="${size*0.344}"
            fill="white" stroke="#4A90E2" stroke-width="${scale}"/>

      <!-- Content lines representing text -->
      <line x1="${size*0.273}" y1="${size*0.312}" x2="${size*0.727}" y2="${size*0.312}"
            stroke="#4A90E2" stroke-width="${scale*2}"/>
      <line x1="${size*0.273}" y1="${size*0.359}" x2="${size*0.664}" y2="${size*0.359}"
            stroke="#4A90E2" stroke-width="${scale*2}"/>
      <line x1="${size*0.273}" y1="${size*0.406}" x2="${size*0.703}" y2="${size*0.406}"
            stroke="#4A90E2" stroke-width="${scale*2}"/>
      <line x1="${size*0.273}" y1="${size*0.453}" x2="${size*0.625}" y2="${size*0.453}"
            stroke="#4A90E2" stroke-width="${scale*2}"/>
      <line x1="${size*0.273}" y1="${size*0.5}" x2="${size*0.688}" y2="${size*0.5}"
            stroke="#4A90E2" stroke-width="${scale*2}"/>

      <!-- Scrollbar -->
      <rect x="${size*0.742}" y="${size*0.258}" width="${size*0.039}" height="${size*0.344}"
            fill="#E0E0E0" stroke="#999" stroke-width="${scale*0.5}"/>
      <rect x="${size*0.742}" y="${size*0.312}" width="${size*0.039}" height="${size*0.156}"
            fill="#4A90E2"/>

      <!-- Camera shutter button -->
      <circle cx="${size/2}" cy="${size*0.742}" r="${size*0.062}"
              fill="white" stroke="#2E6DA4" stroke-width="${scale*2}"/>
      <circle cx="${size/2}" cy="${size*0.742}" r="${size*0.031}"
              fill="#4A90E2"/>

      <!-- Viewfinder corners for screenshot selection -->
      <path d="M ${size*0.234} ${size*0.273} L ${size*0.234} ${size*0.328} M ${size*0.234} ${size*0.273} L ${size*0.289} ${size*0.273}"
            stroke="#FF6B6B" stroke-width="${scale*2}" fill="none" stroke-linecap="round"/>
      <path d="M ${size*0.766} ${size*0.273} L ${size*0.766} ${size*0.328} M ${size*0.766} ${size*0.273} L ${size*0.711} ${size*0.273}"
            stroke="#FF6B6B" stroke-width="${scale*2}" fill="none" stroke-linecap="round"/>
      <path d="M ${size*0.234} ${size*0.586} L ${size*0.234} ${size*0.531} M ${size*0.234} ${size*0.586} L ${size*0.289} ${size*0.586}"
            stroke="#FF6B6B" stroke-width="${scale*2}" fill="none" stroke-linecap="round"/>
      <path d="M ${size*0.766} ${size*0.586} L ${size*0.766} ${size*0.531} M ${size*0.766} ${size*0.586} L ${size*0.711} ${size*0.586}"
            stroke="#FF6B6B" stroke-width="${scale*2}" fill="none" stroke-linecap="round"/>
    </svg>
  `.trim();
}

// Create icons directory if it doesn't exist
const iconsDir = 'icons';
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
  console.log('Created icons directory');
}

console.log('Generating professional icons for Chrome extension...');

// Generate all required icon sizes for Chrome extensions
const sizes = [16, 48, 128, 256, 512];

sizes.forEach(size => {
  const svg = generateIconSVG(size);
  const filename = `${iconsDir}/icon${size}.svg`;
  fs.writeFileSync(filename, svg);
  console.log(`✓ Created ${filename}`);
});

console.log('\n✅ All SVG icons generated successfully!');
console.log('\n📋 Next steps:');
console.log('1. Open create-icons.html in a browser to convert SVGs to PNGs');
console.log('2. Or use an online converter like https://svgtopng.com/');
console.log('3. Update manifest.json to include the icon paths:');
console.log('   "icons": {');
console.log('     "16": "icons/icon16.png",');
console.log('     "48": "icons/icon48.png",');
console.log('     "128": "icons/icon128.png"');
console.log('   }');
