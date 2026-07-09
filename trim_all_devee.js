const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const rootDir = '/Users/davidbendavid/Documents/deVee Web';

// Find all relevant projects
const projects = fs.readdirSync(rootDir).filter(file => {
  return fs.statSync(path.join(rootDir, file)).isDirectory() && !file.startsWith('.');
});

// Target directories within each project
const targetDirs = ['app', 'src/app', 'public', 'frontend/public', 'frontend/app', '']; // '' handles sub-projects e.g. bpm-calculator/public

const validFiles = ['favicon.png', 'icon.png', 'apple-touch-icon.png', 'favicon.ico', 'label_logo.jpg'];

async function processImage(fullPath) {
  try {
    const ext = path.extname(fullPath).toLowerCase();
    const inputBuffer = fs.readFileSync(fullPath);
    let processedBuffer;

    if (ext === '.png' || ext === '.ico') {
      // Trim transparent background
      const trimmed = await sharp(inputBuffer).trim().toBuffer();
      const metadata = await sharp(trimmed).metadata();
      const maxDim = Math.max(metadata.width, metadata.height);

      const extendOptions = {
        top: Math.floor((maxDim - metadata.height) / 2),
        bottom: Math.ceil((maxDim - metadata.height) / 2),
        left: Math.floor((maxDim - metadata.width) / 2),
        right: Math.ceil((maxDim - metadata.width) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      };

      processedBuffer = await sharp(trimmed)
        .extend(extendOptions)
        .resize(512, 512)
        .png() // Convert everything back to png bytes, even if named .ico
        .toBuffer();
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // Trim solid background
      const trimmed = await sharp(inputBuffer).trim().toBuffer();
      const metadata = await sharp(trimmed).metadata();
      const maxDim = Math.max(metadata.width, metadata.height);

      processedBuffer = await sharp(trimmed)
        .extend({
          top: Math.floor((maxDim - metadata.height) / 2),
          bottom: Math.ceil((maxDim - metadata.height) / 2),
          left: Math.floor((maxDim - metadata.width) / 2),
          right: Math.ceil((maxDim - metadata.width) / 2),
        })
        .resize(512, 512)
        .jpeg()
        .toBuffer();
    } else {
      return false; // unsupported
    }

    fs.writeFileSync(fullPath, processedBuffer);
    return true;
  } catch (error) {
    console.error(`Error processing ${fullPath}:`, error.message);
    return false;
  }
}

async function findAndProcessIcons() {
  let count = 0;
  
  // Recursively search for icon files in a directory up to 2 levels deep
  function searchDir(dir, depth = 0) {
    if (depth > 2) return;
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item === '.next' || item === '.git') continue;
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        searchDir(fullPath, depth + 1);
      } else {
        const lowerItem = item.toLowerCase();
        if (validFiles.includes(lowerItem) || (lowerItem.includes('icon') && lowerItem.endsWith('.png'))) {
          // Process it!
          processImage(fullPath).then(success => {
            if (success) {
              console.log(`Trimmed: ${fullPath}`);
            }
          });
          count++;
        }
      }
    }
  }

  for (const proj of projects) {
    const projPath = path.join(rootDir, proj);
    searchDir(projPath);
  }
}

findAndProcessIcons();
