import { createCanvas } from 'canvas';
import fs from 'fs';

const width = 1200;
const height = 264;

const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Dark theme background
ctx.fillStyle = '#0e1524';
ctx.fillRect(0, 0, width, height);

// Add subtle grid pattern for tech feel
ctx.strokeStyle = '#1a2538';
ctx.lineWidth = 1;
for (let x = 0; x < width; x += 40) {
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
}
for (let y = 0; y < height; y += 40) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
}

// Accent line (primary blue)
ctx.fillStyle = '#1860f8';
ctx.fillRect(0, 0, width, 4);

// Title lockup in left half, above midline
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 72px "Outfit", "Segoe UI", sans-serif';
ctx.textAlign = 'left';
ctx.textBaseline = 'middle';

// "SharpTech" on first line
ctx.fillText('SharpTech', 80, 80);

// "Academy" on second line
ctx.font = '600 48px "Outfit", "Segoe UI", sans-serif';
ctx.fillStyle = '#c4840a'; // amber secondary
ctx.fillText('Academy', 80, 150);

// Subtitle/tagline
ctx.font = '400 24px "Outfit", "Segoe UI", sans-serif';
ctx.fillStyle = '#8b9dc3';
ctx.fillText('Aprenda a programar', 80, 210);

// Decorative code brackets in left 50% (x < 600)
ctx.strokeStyle = '#1860f8';
ctx.lineWidth = 3;
// Opening bracket
ctx.beginPath();
ctx.moveTo(480, 60);
ctx.lineTo(520, 60);
ctx.lineTo(520, 100);
ctx.lineTo(480, 100);
ctx.stroke();

// Closing bracket
ctx.beginPath();
ctx.moveTo(520, 164);
ctx.lineTo(480, 164);
ctx.lineTo(480, 204);
ctx.lineTo(520, 204);
ctx.stroke();

// Save as JPEG
const buffer = canvas.toBuffer('image/jpeg', { quality: 0.85 });
fs.writeFileSync('.grok/x-banner.jpg.tmp', buffer);

console.log('x-banner.jpg.tmp created:', buffer.length, 'bytes');