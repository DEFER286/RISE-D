// Vercel Serverless Function
// Post tokko tokkoof og:title, og:description fi og:image kan dhugaa (server irratti) kaa'a,
// akka Telegram, WhatsApp fi Facebook preview sirrii agarsiisaniif.

const VALID_CATEGORIES = ['motivation', 'stories', 'education'];

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

module.exports = async function handler(req, res) {
    const cat = String(req.query.cat || '');
    let slug = String(req.query.slug || '');
    try { slug = decodeURIComponent(slug); } catch (e) {}

    const fallback = () => {
        res.statusCode = 302;
        res.setHeader('Location', `/post.html?cat=${encodeURIComponent(cat)}&slug=${encodeURIComponent(slug)}`);
        res.end();
    };

    if (!VALID_CATEGORIES.includes(cat) || !slug) return fallback();

    try {
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const origin = `https://${host}`;

        const [pageRes, dataRes] = await Promise.all([
            fetch(`${origin}/post.html`),
            fetch(`${origin}/data/${cat}.json`)
        ]);
        if (!pageRes.ok) return fallback();

        let html = await pageRes.text();

        let post = null;
        if (dataRes.ok) {
            const data = await dataRes.json();
            post = (data.items || []).find(item => item.slug === slug) || null;
        }

        if (post) {
            const cleanText = (post.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const shortDesc = cleanText.substring(0, 150) + '...';
            const desc = post.description && post.description.trim() !== '' ? post.description : shortDesc;
            const title = post.title || 'RiseToday';
            const image = post.image
                ? (/^https?:\/\//.test(post.image) ? post.image : origin + post.image)
                : null;
            const url = `${origin}/${cat}/${slug}`;

            html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
            html = html.replace(/<meta id="meta-og-title"[^>]*>/, `<meta id="meta-og-title" property="og:title" content="${esc(title)}" />`);
            html = html.replace(/<meta id="meta-og-desc"[^>]*>/, `<meta id="meta-og-desc" property="og:description" content="${esc(desc)}" />`);
            if (image) {
                html = html.replace(/<meta id="meta-og-image"[^>]*>/, `<meta id="meta-og-image" property="og:image" content="${esc(image)}" />`);
            }
            const extra =
                `    <meta property="og:url" content="${esc(url)}" />\n` +
                `    <meta name="description" content="${esc(desc)}" />\n`;
            html = html.replace('</head>', extra + '</head>');
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
        res.end(html);
    } catch (e) {
        console.error('post api error:', e);
        return fallback();
    }
};
