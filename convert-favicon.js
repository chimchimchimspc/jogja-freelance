const sharp = require('sharp');
const path = require('path');

const logoPath = path.join(__dirname, 'public/logo.png');
const faviconPath = path.join(__dirname, 'public/favicon.ico');

sharp(logoPath)
  .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .toFile(faviconPath)
  .then(() => console.log('Favicon created successfully!'))
  .catch(err => console.error('Error:', err));
