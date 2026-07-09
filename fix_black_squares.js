const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const rootDir = '/Users/davidbendavid/Documents/deVee Web';

// Find all relevant projects
const projects = fs.readdirSync(rootDir).filter(file => {
  return fs.statSync(path.join(rootDir, file)).isDirectory() && !file.startsWith('.');
});

async function processImage(fullPath) {
  try {
    const inputBuffer = fs.readFileSync(fullPath);
    const metadata = await sharp(inputBuffer).metadata();
    
    const size = Math.min(metadata.width, metadata.height);
    
    // Create a circular SVG mask
    const circleSvg = `
      <svg width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white" />
      </svg>
    `;

    const pngPath = fullPath.replace(/\.jpg$/, '.png');

    await sharp(inputBuffer)
      .resize(size, size)
      .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
      .png()
      .toFile(pngPath);

    // Delete the original JPG
    fs.unlinkSync(fullPath);
    console.log(`Converted and made transparent: ${pngPath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${fullPath}:`, error.message);
    return false;
  }
}

function replaceInFiles(dir) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === '.next' || item === '.git') continue;
    
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      replaceInFiles(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (['.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.mjs'].includes(ext)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('label_logo.jpg')) {
          content = content.replace(/label_logo\.jpg/g, 'label_logo.png');
          fs.writeFileSync(fullPath, content);
          console.log(`Updated references in: ${fullPath}`);
        }
      }
    }
  }
}

async function fixBlackSquares() {
  for (const proj of projects) {
    const projPath = path.join(rootDir, proj);
    
    // Convert label_logo.jpg to label_logo.png
    const findAndConvert = (dir) => {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item === 'node_modules' || item === '.next' || item === '.git') continue;
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          findAndConvert(fullPath);
        } else if (item.toLowerCase() === 'label_logo.jpg') {
          processImage(fullPath);
        }
      }
    };
    
    findAndConvert(projPath);
    
    // Replace text references
    replaceInFiles(projPath);
  }
}

fixBlackSquares();
