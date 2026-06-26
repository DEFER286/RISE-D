const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  const { category, slug } = req.query;

  try {
    // File JSON dubbisuu
    const filePath = path.join(process.cwd(), 'data', `${category}.json`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Category file hin argamne');
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    const articles = JSON.parse(fileData);

    // Barruu slug kanaan barbaaduu
    const article = articles.find(a => a.slug === slug);

    if (!article) {
      return res.status(404).send('Barruun kun hin argamne');
    }

    // HTML Meta Tags Telegram'f deebisuu
    const html = `
      <!DOCTYPE html>
      <html lang="om">
      <head>
        <meta charset="UTF-8">
        <title>${article.title} - RiseToday</title>
        <meta property="og:title" content="${article.title}" />
        <meta property="og:description" content="${article.description || 'Barruulee babbaredoo dubbisi.'}" />
        <meta property="og:image" content="${article.imageUrl}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://risetoday.vercel.app/${category}/${slug}" />
        
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
    return res.status(500).send('Error: ' + error.message);
  }
};
