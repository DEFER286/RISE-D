const fs = require('fs');

const BASE_URL = 'https://rise-d.vercel.app';
const today = new Date().toISOString().split('T')[0];

const categories = [
  { cat: 'motivation', file: './data/motivation.json' },
  { cat: 'stories',    file: './data/stories.json' },
  { cat: 'education',  file: './data/education.json' },
];

let urls = [
  makeUrl(`${BASE_URL}/`, '1.00'),
  makeUrl(`${BASE_URL}/motivation.html`, '0.80'),
  makeUrl(`${BASE_URL}/stories.html`, '0.80'),
  makeUrl(`${BASE_URL}/education.html`, '0.80'),
  makeUrl(`${BASE_URL}/about.html`, '0.60'), by
];

for (const { cat, file } of categories) {
  if (!fs.existsSync(file)) {
    console.warn(`⚠️ File hin argamne: ${file}`);
    continue;
  }

  try {
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.items)
      ? data.items
      : [];

    items.forEach((item, index) => {
      const id = index + 1;
      const date = item?.date
        ? item.date.split('T')[0]
        : today;

      urls.push(
        makeUrl(
          `${BASE_URL}/post.html?cat=${cat}&id=${id}`,
          '0.70',
          date
        )
      );
    });

    console.log(`✅ ${cat}: posts ${items.length}`);
  } catch (err) {
    console.error(`❌ JSON error in ${file}:`, err.message);
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

fs.writeFileSync('./sitemap.xml', sitemap);
console.log(`🚀 sitemap.xml updated! URLs ${urls.length}`);

function makeUrl(loc, priority, lastmod = today) {
  const safeLoc = loc.replace(/&/g, '&amp;');
  return `  <url>
    <loc>${safeLoc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </url>`;
}
