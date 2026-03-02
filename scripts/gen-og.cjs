/**
 * 生成 readmoo-ap OG 圖（DS 文青 V0.1 配色）
 * node scripts/gen-og.js
 */
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// --- Register fonts ---
// Windows system fonts
const fontPaths = [
  { path: 'C:/Windows/Fonts/msjhbd.ttc', family: 'Microsoft JhengHei', weight: 'bold' },
  { path: 'C:/Windows/Fonts/msjh.ttc', family: 'Microsoft JhengHei', weight: 'normal' },
];
fontPaths.forEach(f => {
  if (fs.existsSync(f.path)) {
    registerFont(f.path, { family: f.family, weight: f.weight });
  }
});

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// --- Colors (DS 文青 V0.1) ---
const C = {
  sage: '#A8B5A0',
  sageDark: '#889B7E',
  sageLight: '#C5CFBF',
  lavender: '#AEA8B8',
  lavenderLight: '#C8C3D0',
  ink: '#5C4A3A',
  textPrimary: '#3D3833',
  textSecondary: '#5C5650',
  textMuted: '#8A847E',
  textHint: '#B0A99F',
  bgPage: '#F7F5F2',
  bgCard: '#FFFFFF',
  border: '#E5E0DB',
};

// --- Background ---
const bgGrad = ctx.createLinearGradient(0, 0, W, H);
bgGrad.addColorStop(0, '#F7F5F2');
bgGrad.addColorStop(1, '#EDE9E4');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, W, H);

// Subtle paper lines
ctx.strokeStyle = 'rgba(168,181,160,0.04)';
ctx.lineWidth = 1;
for (let y = 80; y < H; y += 80) {
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();
}

// --- E-reader device ---
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// Device shadow
ctx.fillStyle = 'rgba(0,0,0,0.08)';
roundRect(84, 72, 400, 500, 20);
ctx.fill();

// Device body
ctx.fillStyle = '#3A3A3A';
roundRect(80, 65, 400, 500, 20);
ctx.fill();

// Screen
const screenGrad = ctx.createLinearGradient(105, 90, 105, 510);
screenGrad.addColorStop(0, '#FFFDF8');
screenGrad.addColorStop(1, '#F7F5F2');
ctx.fillStyle = screenGrad;
roundRect(105, 90, 350, 420, 4);
ctx.fill();

// Screen header
ctx.fillStyle = 'rgba(168,181,160,0.18)';
roundRect(105, 90, 350, 44, 4);
ctx.fill();

// Header text
ctx.font = '600 16px "Microsoft JhengHei"';
ctx.fillStyle = C.ink;
ctx.textAlign = 'center';
ctx.fillText('AP 接龍書單', 280, 118);

// Home button
ctx.strokeStyle = '#666';
ctx.lineWidth = 1.5;
ctx.beginPath();
ctx.arc(280, 545, 12, 0, Math.PI * 2);
ctx.stroke();

// --- Book list on screen ---
const books = [
  { title: '原子習慣', author: 'James Clear', name: '@五花', color: C.sage },
  { title: '被討厭的勇氣', author: '岸見一郎', name: '@莎朗', color: C.lavender },
  { title: '人生四千個禮拜', author: 'Oliver Burkeman', name: '@犢叔', color: C.sageDark },
  { title: '刻意練習', author: 'Anders Ericsson', name: '', color: C.sageLight, faded: true },
];

const listX = 120, listY = 150;
books.forEach((b, i) => {
  const y = listY + i * 62;
  const alpha = b.faded ? 0.5 : 1;

  ctx.globalAlpha = alpha;

  // Card background
  ctx.fillStyle = '#FFF';
  roundRect(listX, y, 320, 52, 6);
  ctx.fill();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1;
  roundRect(listX, y, 320, 52, 6);
  ctx.stroke();

  // Number circle
  ctx.globalAlpha = alpha * 0.7;
  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.arc(listX + 20, y + 26, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 10px "Microsoft JhengHei"';
  ctx.textAlign = 'center';
  ctx.fillText(String(i + 1), listX + 20, y + 30);

  // Title
  ctx.fillStyle = C.textPrimary;
  ctx.font = '500 13px "Microsoft JhengHei"';
  ctx.textAlign = 'left';
  ctx.fillText(b.title, listX + 38, y + 22);

  // Author
  ctx.fillStyle = C.textMuted;
  ctx.font = '11px "Microsoft JhengHei"';
  ctx.fillText(b.author, listX + 38, y + 40);

  // AP name
  if (b.name) {
    ctx.fillStyle = b.color;
    ctx.font = '500 11px "Microsoft JhengHei"';
    ctx.textAlign = 'right';
    ctx.fillText(b.name, listX + 290, y + 30);
  }

  ctx.globalAlpha = 1;
});

// --- Right side content ---
// Brand gradient line
const brandGrad = ctx.createLinearGradient(560, 160, 620, 160);
brandGrad.addColorStop(0, C.sage);
brandGrad.addColorStop(1, C.lavender);
ctx.fillStyle = brandGrad;
roundRect(560, 160, 60, 4, 2);
ctx.fill();

// Title
ctx.font = '600 38px "Microsoft JhengHei"';
ctx.fillStyle = C.ink;
ctx.textAlign = 'left';
ctx.fillText('讀墨 AP 接龍工具', 560, 212);

// Subtitle
ctx.font = '18px "Microsoft JhengHei"';
ctx.fillStyle = C.textMuted;
ctx.fillText('1500日挑戰社群專用', 560, 252);

// Feature pills
const pills = [
  { text: 'AP 名冊管理', x: 560, w: 120, color: C.sage },
  { text: '書單追蹤', x: 692, w: 100, color: C.lavender },
  { text: '一鍵複製書名', x: 804, w: 130, color: C.sage },
];
pills.forEach(p => {
  // Pill background
  ctx.fillStyle = p.color + '20';
  roundRect(p.x, 290, p.w, 34, 17);
  ctx.fill();
  // Pill text
  ctx.font = '500 13px "Microsoft JhengHei"';
  ctx.fillStyle = p.color === C.sage ? C.sageDark : C.lavender;
  ctx.textAlign = 'center';
  ctx.fillText(p.text, p.x + p.w / 2, 312);
});

// Description
ctx.textAlign = 'left';
ctx.font = '15px "Microsoft JhengHei"';
ctx.fillStyle = C.textMuted;
ctx.fillText('互相支持的買書方式', 560, 370);
ctx.fillText('一本書配一個人的連結，輪流接龍', 560, 394);

// Footer line
ctx.strokeStyle = C.border;
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(560, 430);
ctx.lineTo(740, 430);
ctx.stroke();

// Footer text
ctx.font = '13px "Microsoft JhengHei"';
ctx.fillStyle = C.textHint;
ctx.fillText('tools.helloruru.com', 560, 454);

// --- Washi tape decoration ---
ctx.save();
ctx.translate(560, 529);
ctx.rotate(-3 * Math.PI / 180);
ctx.fillStyle = 'rgba(168,181,160,0.30)';
ctx.fillRect(-40, -9, 80, 18);
ctx.restore();

ctx.save();
ctx.translate(665, 534);
ctx.rotate(2 * Math.PI / 180);
ctx.fillStyle = 'rgba(174,168,184,0.30)';
ctx.fillRect(-45, -9, 90, 18);
ctx.restore();

// --- Output ---
const outPath = path.join(__dirname, '../public/readmoo-ap/og.png');
const buf = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buf);
console.log(`og.png: ${W}x${H}, ${Math.round(buf.length / 1024)}KB → ${outPath}`);
