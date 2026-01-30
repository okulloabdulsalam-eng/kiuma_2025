// Simple icon generator for KIUMA PWA
// Run with: node icons/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG-based icon generator
function createIcon(size, filename, isMaskable = false) {
    const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${isMaskable ? 'transparent' : '#757575'}" ${isMaskable ? 'rx="20%" ry="20%"' : ''}/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold" 
          text-anchor="middle" dominant-baseline="middle" fill="${isMaskable ? '#757575' : 'white'}">
        KIUMA
    </text>
</svg>`;

    fs.writeFileSync(path.join(__dirname, filename), svg);
    console.log(`Created ${filename}`);
}

// Generate all required icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Generating PWA icons...');

// Regular icons
sizes.forEach(size => {
    createIcon(size, `icon-${size}x${size}.png`);
});

// Maskable icons
[192, 512].forEach(size => {
    createIcon(size, `icon-maskable-${size}x${size}.png`, true);
});

console.log('All icons generated successfully!');
console.log('Note: These are SVG placeholders. For production, replace with proper PNG icons.');
