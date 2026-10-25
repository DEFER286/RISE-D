// Post slug fachuuf gargaaru
function getPostSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('slug');
    if (!slug) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2 && pathParts[0] !== 'post.html') {
            slug = pathParts[1];
        }
    }
    return slug || window.location.pathname;
}

let isSignUpMode = false;

// Sign In / Sign Up foomii jijjiiruuf
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const titleEl = document.getElementById('auth-modal-title');
    const switchEl = document.getElementById('auth-switch-text');
    if (isSignUpMode) {
        titleEl.innerText = "Create an Account (Sign Up)";
        switchEl.innerText = "Already have an account? Sign In";
    } else {
        titleEl.innerText = "Sign In to Your Account";
        switchEl.innerText = "Don't have an account? Sign Up";
    }
}

// Authentication (Login/SignUp) hojii irra oolchuuf
async function handleAuthSubmit() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    if (!email || !password) {
        alert("Maaloo Email fi Password guuti!");
        return;
    }

    if (isSignUpMode) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
            alert("Rakkina Sign Up: " + error.message);
        } else {
            alert("Galmeen milkaa'e! Amma login gochuu dandeessa.");
            isSignUpMode = false;
            toggleAuthMode();
        }
    } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert("Rakkina Login: " + error.message);
        } else {
            alert("Milkaa'inaan seenteetta! 🎉");
            document.getElementById('auth-modal').style.display = 'none';
            loadReactions();
            loadComments();
        }
    }
}

// === REACTIONS LOGIC ===
async function handleReaction(type) {
    const slug = getPostSlug();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert("React gochuuf dursa Sign Up ykn Login godhadhu!");
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }

    const { data, error } = await supabase
        .from('reactions')
        .insert([{ post_slug: slug, reaction_type: type, user_id: user.id }]);

    if (!error) {
        alert("Milkaa'inaan react godheetta!");
        loadReactions();
    } else {
        alert("Rakkina: " + error.message);
    }
}

async function loadReactions() {
    const slug = getPostSlug();
    const { data, error } = await supabase
        .from('reactions')
        .select('reaction_type, post_slug');

    if (!error && data) {
        const filtered = data.filter(r => r.post_slug === slug);
        let counts = { like: 0, love: 0, funny: 0 };
        filtered.forEach(r => {
            if (counts[r.reaction_type] !== undefined) {
                counts[r.reaction_type]++;
            }
        });
        ['like', 'love', 'funny'].forEach(type => {
            const el = document.getElementById(`${type}-count`);
            if (el) el.innerText = counts[type];
        });
    }
}

// === COMMENTS LOGIC ===
async function submitComment() {
    const slug = getPostSlug();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert("Yaada kennuuf dursa Sign Up ykn Login godhadhu!");
        document.getElementById('auth-modal').style.display = 'flex';
        return;
    }

    const text = document.getElementById('comment-text').value.trim();
    if (!text) {
        alert("Maaloo yaada kee barreessi!");
        return;
    }

    const { data, error } = await supabase
        .from('comments')
        .insert([{ post_slug: slug, comment_text: text, user_email: user.email }]);

    if (!error) {
        document.getElementById('comment-text').value = '';
        loadComments();
    } else {
        alert("Rakkina: " + error.message);
    }
}

async function loadComments() {
    const slug = getPostSlug();
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error && data) {
        const filteredComments = data.filter(c => c.post_slug === slug);
        const list = document.getElementById('comment-list');
        if (!list) return;
        list.innerHTML = '';

        filteredComments.forEach(c => {
            const div = document.createElement('div');
            const isLight = document.body.classList.contains('light-mode');
            div.style.cssText = isLight
                ? 'background:#f5f5f5; border-radius:10px; padding:12px; margin-bottom:10px; text-align:left; border-left: 3px solid #000000;'
                : 'background:#1a1a1a; border-radius:10px; padding:12px; margin-bottom:10px; text-align:left; border-left: 3px solid #ffffff;';
            const nameColor = isLight ? '#000000' : '#ffffff';
            const textColor = isLight ? '#333' : '#ccc';
            div.innerHTML = `<strong style="color:${nameColor};">${c.user_email}</strong><p style="color:${textColor}; margin:6px 0 0; font-size:14px;">${c.comment_text}</p>`;
            list.appendChild(div);
        });

        const countEl = document.getElementById('comment-count');
        const headingCountEl = document.getElementById('comment-heading-count');
        if (countEl) countEl.innerText = filteredComments.length;
        if (headingCountEl) headingCountEl.innerText = filteredComments.length;
    }
}

// === SAVE / FAVORITE LOGIC ===
function toggleSaveArticle() {
    const slug = getPostSlug();
    let savedArticles = JSON.parse(localStorage.getItem('savedArticlesList')) || [];
    const title = document.getElementById('post-title')?.innerText || "Rise Today Article";
    const currentUrl = window.location.pathname + window.location.search;

    const index = savedArticles.findIndex(a => a.id === slug);
    if (index === -1) {
        savedArticles.push({ id: slug, title: title, url: currentUrl });
        localStorage.setItem('savedArticlesList', JSON.stringify(savedArticles));
    } else {
        savedArticles.splice(index, 1);
        localStorage.setItem('savedArticlesList', JSON.stringify(savedArticles));
    }
    updateSaveButtonVisual();
}

function updateSaveButtonVisual() {
    const slug = getPostSlug();
    let savedArticles = JSON.parse(localStorage.getItem('savedArticlesList')) || [];
    const btn = document.getElementById('save-btn');
    if (!btn) return;
    
    const isLight = document.body.classList.contains('light-mode');
    const isSaved = savedArticles.some(a => a.id === slug);
    if (isSaved) { 
        btn.innerHTML = "❤️ saved"; 
        btn.style.background = isLight ? "#000000" : "#ffffff"; 
        btn.style.color = isLight ? "#ffffff" : "#000000"; 
        btn.style.borderColor = isLight ? "#000000" : "#ffffff";
    } else { 
        btn.innerHTML = "🔖 save"; 
        btn.style.background = isLight ? "#f0f0f0" : "#222"; 
        btn.style.color = isLight ? "#000000" : "#ffffff"; 
        btn.style.borderColor = isLight ? "#ccc" : "#444";
    }
}

// Yeroo fuulli banamu ragaan akka fe'amu gochuu
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        loadReactions();
        loadComments();
        updateSaveButtonVisual();
    }, 600);
});
