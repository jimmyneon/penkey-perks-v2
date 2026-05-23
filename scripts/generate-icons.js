const fs = require('fs');
const path = require('path');

// Create a simple PNG data URL for a colored square with text
function createIconDataURL(size, bgColor, text, textColor) {
  // Create SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${size/8}" fill="${bgColor}"/>
      <text x="50%" y="50%" font-size="${size * 0.6}" text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-family="Arial, sans-serif" font-weight="bold">${text}</text>
    </svg>
  `;
  
  return svg;
}

// Generate icons
const publicDir = path.join(__dirname, '..', 'public');

// Create 192x192 icon
const icon192 = createIconDataURL(192, '#FFD93B', 'P', '#8B6F47');
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192);

// Create 512x512 icon
const icon512 = createIconDataURL(512, '#FFD93B', 'P', '#8B6F47');
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512);

console.log('Icons generated successfully!');
console.log('Note: These are SVG files. For PNG, you can use an online converter or install sharp.');
