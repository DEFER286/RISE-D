const fs = require('fs');

// ============================================
// RISE-D Sitemap Auto-Generator
// Fayyadama: node generate-sitemap.js
// ============================================

const BASE_URL = 'https://rise-d.vercel.app';
const today = new Date().toISOString().split('T')[0];

// Category files - maqaa file JSON keetiin sirreessi
const categories = [
  { cat: 'motivation', file: './data/motivation.json' },
  { cat: 'stories',    file: './data/stories.json'    },
  { cat: 'education',  file: './data/education.json'  },
];

// Pages static (harkaan hin jijjiiramu)
let urls = [
  makeUrl(`${BASE_URL}/`,                '1.00'),
  makeUrl(`${BASE_URL}/motivation.html`, '0.80'),
  makeUrl(`${BASE_URL}/stories.html`,      '0.80'),
  makeUrl(`${BASE_URL}/education.html`,  '0.80'),
  makeUrl(`${BASE_URL}/about.html`,        '0.60'),
];

// Posts dynamic - JSON irraa ofumaan uuma
for (const { cat, file } of categories) {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️  File hin argamne: ${file}`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const items = data.items || data;

  items.forEach((item, index) => {
    const id   = index + 1;
    const date = item.date ? item.date.split('T')[0] : today;
    urls.push(makeUrl(`${BASE_URL}/post.html?cat=${cat}&id=${id}`, '0.70', date));
  });

  console.log(`✅ ${cat}: posts ${items.length} jiru`);
}

// Sitemap XML uumi
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

fs.writeFileSync('./sitemap.xml', sitemap);
console.log(`\n🚀 sitemap.xml updated! URLs ${urls.length} jiru.`);

// ---- Helper ----
function makeUrl(loc, priority, lastmod = today) {
  // & → &amp; sitemap keessatti
  const safeLoc = loc.replace(/&/g, '&amp;');
  return `  <url>
    <loc>${safeLoc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </url>`;
    }

