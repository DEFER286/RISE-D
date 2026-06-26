import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { category, slug } = req.query;

  try {
    // 1. File JSON folder 'data' keessa jiru dubbisuu (Fkn: data/motivation.json)
    const filePath = path.join(process.cwd(), 'data', `${category}.json`);
    const fileData = fs.readFileSync(filePath, 'utf8');
    const articles = JSON.parse(fileData);

    // 2. Barruu slug kanaan wal fakkaatu barbaaduu
    const article = articles.find(a => a.slug === slug);

    if (!article) {
      return res.status(404).send('Barruun hin argamne');
    }

    // 3. HTML Meta Tags Telegram'f deebisuu
    // Akkasumas akkuma ati kanaan dura qabdu gara '/post.html?cat=...&slug=...' irratti redirect godha
    const html = `
      <!DOCTYPE html>
      <html lang="om">
      <head>
        <meta charset="UTF-8">
        <title>${article.title} - RiseToday</title>
        <meta property="og:title" content="${article.title}" />
        <meta property="og:description" content="${article.description || 'Barruulee babbaredoo dubbisi.'}" />
        <meta property="og:image" content="${article.imageUrl}" />
    <!-- Hammi suuraa gadii kun Telegram akka bal'isee fidu dirqamsiisa -->
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://risetoday.vercel.app/${category}/${slug}" />
        
        <!-- Koodiin kun akkuma namni cuqaaseen gara fuula kee isa duraanitti daddarsa -->
        <script>
          window.location.href = "/post.html?cat=${category}&slug=${slug}";
        </script>
      </head>
      <body>
        <h1>${article.title}</h1>
        <p>Gara fuula barruutti si daddarsaa jira...</p>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    return res.status(500).send('Hojii irra error uumame');
  }
}
