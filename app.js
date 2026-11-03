// Post slug amanamummaan fiduuf
function getPostSlug() {
    const urlParams = new URLSearchParams(window.location.search);
    let slug = urlParams.get('slug');
    if (!slug) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
            slug = pathParts[pathParts.length - 1];
        }
    }
    return slug || 'default-post';
}

let isSignUpMode = false;

const EYE_ON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

function setPasswordVisible(visible) {
    const input = document.getElementById('auth-password');
    const eye = document.getElementById('auth-eye');
    if (!input || !eye) return;
    input.type = visible ? 'text' : 'password';
    eye.innerHTML = visible ? EYE_OFF : EYE_ON;
    eye.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
}

function togglePasswordVisibility() {
    const input = document.getElementById('auth-password');
    setPasswordVisible(input && input.type === 'password');
}

async function handleForgotPassword() {
    const email = (document.getElementById('auth-email')?.value || '').trim();
    if (!email) {
        alert("Dura email kee gubbaa barreessi, booda 'Forgot password?' tuqi.");
        return;
    }
    try {
        const { error } = await sbClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        if (error) {
            alert("Rakkina: " + error.message);
        } else {
            alert("Email kee ilaali. Password haaraa kaa'uuf link ergameera (spam folder illee ilaali).");
        }
    } catch (e) {
        alert("Dogoggora: " + e.message);
    }
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    setPasswordVisible(false);
    const $ = (id) => document.getElementById(id);
    if ($('auth-forgot')) $('auth-forgot').style.display = isSignUpMode ? 'none' : 'block';
    if ($('auth-pw-hint')) $('auth-pw-hint').style.display = isSignUpMode ? 'block' : 'none';
    if ($('auth-modal-title')) $('auth-modal-title').innerText = isSignUpMode ? 'Create an Account' : 'Sign In to Your Account';
    if ($('auth-submit')) $('auth-submit').innerText = isSignUpMode ? 'SIGN UP' : 'SIGN IN';
    if ($('auth-password')) $('auth-password').autocomplete = isSignUpMode ? 'new-password' : 'current-password';
    if ($('auth-switch-text')) {
        $('auth-switch-text').innerHTML = isSignUpMode
            ? 'Already have an account? <span class="au-link">SIGN IN</span>'
            : 'Don\'t have an account yet? <span class="au-link">CREATE ONE NOW</span>';
    }
}

// === SOCIAL LOGIN (Google / Facebook) ===
// Supabase irratti provider banaa yoo ta'e qofa button mul'ata. Dirqisiisuuf: const OAUTH_FORCE = ['google'];
const OAUTH_FORCE = [];

async function handleOAuth(provider) {
    try {
        if (typeof sbClient === 'undefined') {
            alert("Supabase hin fe'amne!");
            return;
        }
        const { error } = await sbClient.auth.signInWithOAuth({
            provider: provider,
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
        if (error) alert("Rakkina: " + error.message);
    } catch (e) {
        alert("Dogoggora: " + e.message);
    }
}

async function initSocialButtons() {
    const box = document.getElementById('auth-social');
    if (!box) return;
    let enabled = {};
    try {
        const r = await fetch(SUPABASE_URL + '/auth/v1/settings', { headers: { apikey: SUPABASE_KEY } });
        if (r.ok) {
            const settings = await r.json();
            enabled = settings.external || {};
        }
    } catch (e) {}
    let any = false;
    box.querySelectorAll('[data-provider]').forEach(btn => {
        const on = enabled[btn.dataset.provider] === true || OAUTH_FORCE.includes(btn.dataset.provider);
        btn.style.display = on ? 'flex' : 'none';
        if (on) any = true;
    });
    box.style.display = any ? 'block' : 'none';
}

window.addEventListener('DOMContentLoaded', () => {
    initSocialButtons();
    // Enter tuquun Sign In/Sign Up ergisa
    ['auth-email', 'auth-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuthSubmit(); });
    });
});

async function handleAuthSubmit() {
    try {
        const emailInput = document.getElementById('auth-email');
        const passwordInput = document.getElementById('auth-password');
        if (!emailInput || !passwordInput) return;
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Maaloo Email fi Password guuti!");
            return;
        }

        if (typeof sbClient === 'undefined') {
            alert("Supabase client is not loaded!");
            return;
        }

        if (isSignUpMode) {
            if (password.length < 6) {
                alert("Password yoo xiqqaate qubee 6 ta'uu qaba!");
                return;
            }
            const { data, error } = await sbClient.auth.signUp({ email, password });
            if (error) {
                alert("Rakkina Sign Up: " + error.message);
            } else if (data.session) {
                // Email confirmation cufaa yoo ta'e, battalumatti seena
                alert("Galmeen milkaa'e! Amma seentee jirta. 🎉");
                const modal = document.getElementById('auth-modal');
                if (modal) modal.style.display = 'none';
                isSignUpMode = true;
                toggleAuthMode();
                updateAuthUI();
                loadReactions();
                loadComments();
            } else {
                alert("Galmeen milkaa'e! Email kee ilaalii mirkaneessi, booda login godhi.");
                isSignUpMode = true;
                toggleAuthMode(); // gara Sign In deebi'a
            }
        } else {
            const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
            if (error) {
                alert("Rakkina Login: " + error.message);
            } else {
                alert("Milkaa'inaan seenteetta! 🎉");
                const modal = document.getElementById('auth-modal');
                if (modal) modal.style.display = 'none';
                updateAuthUI();
                loadReactions();
                loadComments();
            }
        }
    } catch (err) {
        console.error("Auth error:", err);
        alert("Dogoggora: " + err.message);
    }
}

// === VIEW COUNTER ===
function formatViews(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
}

async function registerView() {
    try {
        if (typeof sbClient === 'undefined') return;
        const slug = getPostSlug();
        const el = document.getElementById('post-views');
        if (!slug || !el) return;

        // Nama tokko guyyaatti al tokko qofa lakkaa'ama
        const key = 'viewed_' + slug;
        const today = new Date().toISOString().slice(0, 10);
        let views = null;

        if (localStorage.getItem(key) !== today) {
            const { data, error } = await sbClient.rpc('increment_view', { p_slug: slug });
            if (!error) {
                views = data;
                localStorage.setItem(key, today);
            }
        }
        if (views === null) {
            const { data } = await sbClient.from('post_views').select('views').eq('post_slug', slug).maybeSingle();
            views = data ? data.views : 0;
        }
        el.textContent = ' · 👁 ' + formatViews(Number(views));
    } catch (e) {
        console.error("View counter error:", e);
    }
}

// === LOGOUT + AUTH STATUS ===
async function updateAuthUI() {
    const el = document.getElementById('auth-status');
    if (!el || typeof sbClient === 'undefined') return;
    try {
        const { data } = await sbClient.auth.getSession();
        const user = data && data.session ? data.session.user : null;
        el.innerHTML = '';
        if (user) {
            const who = document.createElement('span');
            who.textContent = '👤 ' + user.email.split('@')[0];
            const out = document.createElement('button');
            out.textContent = 'Logout';
            out.style.cssText = 'background:none; border:1px solid #666; color:inherit; border-radius:14px; padding:3px 12px; font-size:12px; cursor:pointer; margin-left:10px;';
            out.addEventListener('click', handleLogout);
            el.append(who, out);
        } else {
            const inBtn = document.createElement('button');
            inBtn.textContent = 'Sign In / Sign Up';
            inBtn.style.cssText = 'background:none; border:1px solid #666; color:inherit; border-radius:14px; padding:3px 12px; font-size:12px; cursor:pointer;';
            inBtn.addEventListener('click', () => {
                const modal = document.getElementById('auth-modal');
                if (modal) modal.style.display = 'flex';
            });
            el.append(inBtn);
        }
    } catch (e) {
        console.error("Auth UI error:", e);
    }
}

async function handleLogout() {
    try {
        const { error } = await sbClient.auth.signOut();
        if (error) {
            alert("Rakkina Logout: " + error.message);
            return;
        }
        updateAuthUI();
        loadComments();
        loadReactions();
    } catch (e) {
        alert("Dogoggora: " + e.message);
    }
}

// === REACTIONS LOGIC ===
async function handleReaction(type) {
    try {
        const slug = getPostSlug();
        
        if (typeof sbClient === 'undefined') {
            alert("Supabase CDN hin fe'amne!");
            return;
        }

        const { data: sessionData } = await sbClient.auth.getSession();
        const user = sessionData?.session?.user;
        
        if (!user) {
            const modal = document.getElementById('auth-modal');
            if (modal) {
                modal.style.display = 'flex';
            } else {
                alert("React gochuuf dursa Sign Up ykn Login godhadhu!");
            }
            return;
        }

        const { error } = await sbClient
            .from('reactions')
            .insert([{ post_slug: slug, reaction_type: type, user_id: user.id }]);

        if (!error) {
            loadReactions();
        } else {
            alert("Rakkina Database: " + error.message);
        }
    } catch (e) {
        console.error("Reaction error:", e);
        alert("Dogoggora: " + e.message);
    }
}

async function loadReactions() {
    try {
        if (typeof sbClient === 'undefined') return;
        const slug = getPostSlug();
        const { data, error } = await sbClient
            .from('reactions')
            .select('reaction_type, post_slug')
            .eq('post_slug', slug);

        if (!error && data) {
            let counts = { like: 0, love: 0, funny: 0 };
            data.forEach(r => {
                if (counts[r.reaction_type] !== undefined) {
                    counts[r.reaction_type]++;
                }
            });
            ['like', 'love', 'funny'].forEach(type => {
                const el = document.getElementById(`${type}-count`);
                if (el) el.innerText = counts[type];
            });
        }
    } catch (e) {
        console.error("Load reactions error:", e);
    }
}

// === COMMENTS LOGIC ===
let commentBusy = false;
async function submitComment() {
    if (commentBusy) return;
    commentBusy = true;
    const sendBtn = document.getElementById('comment-send');
    if (sendBtn) sendBtn.disabled = true;
    try {
        const slug = getPostSlug();
        if (typeof sbClient === 'undefined') {
            alert("Supabase hin fe'amne!");
            return;
        }

        const { data: sessionData } = await sbClient.auth.getSession();
        const user = sessionData?.session?.user;
        
        if (!user) {
            const modal = document.getElementById('auth-modal');
            if (modal) {
                modal.style.display = 'flex';
            } else {
                alert("Yaada kennuuf dursa Sign Up ykn Login godhadhu!");
            }
            return;
        }

        const textEl = document.getElementById('comment-text');
        if (!textEl) return;
        const text = textEl.value.trim();
        if (!text) {
            alert("Maaloo yaada kee barreessi!");
            return;
        }

        const { error } = await sbClient
            .from('comments')
            .insert([{ post_slug: slug, comment_text: text, user_name: user.email.split('@')[0], user_id: user.id }]);

        if (!error) {
            textEl.value = '';
            textEl.style.height = 'auto';
            loadComments(true);
        } else {
            alert("Rakkina Database: " + error.message);
        }
    } catch (e) {
        console.error("Comment submit error:", e);
        alert("Dogoggora: " + e.message);
    } finally {
        commentBusy = false;
        if (sendBtn) sendBtn.disabled = false;
    }
}

function makeCommentAction(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
}

const AVATAR_COLORS = ['#e53935', '#8e24aa', '#3949ab', '#1e88e5', '#00897b', '#43a047', '#fb8c00', '#6d4c41', '#546e7a', '#d81b60'];
function avatarColor(name) {
    let h = 0;
    for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function timeAgo(iso) {
    const t = new Date(iso).getTime();
    const s = Math.floor((Date.now() - t) / 1000);
    if (isNaN(s) || s < 60) return 'Amma';
    const m = Math.floor(s / 60);
    if (m < 60) return m + 'm';
    const hr = Math.floor(m / 60);
    if (hr < 24) return hr + 'h';
    const d = Math.floor(hr / 24);
    if (d < 7) return d + 'd';
    const w = Math.floor(d / 7);
    if (w < 5) return w + 'w';
    return new Date(t).toLocaleDateString();
}

async function loadComments(scrollToBottom) {
    try {
        if (typeof sbClient === 'undefined') return;
        const slug = getPostSlug();

        const { data: sessionData } = await sbClient.auth.getSession();
        const myId = sessionData?.session?.user?.id;

        const { data, error } = await sbClient
            .from('comments')
            .select('*')
            .eq('post_slug', slug)
            .order('created_at', { ascending: true });

        if (!error && data) {
            const list = document.getElementById('comment-list');
            if (!list) return;
            const prevScroll = list.scrollTop;
            list.innerHTML = '';

            if (data.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'cm-empty';
                empty.textContent = "Yaadni hin jiru. Isa jalqabaa ta'i! 💬";
                list.appendChild(empty);
            }

            data.forEach(c => {
                const name = c.user_name || (c.user_email ? c.user_email.split('@')[0] : 'User');

                const item = document.createElement('div');
                item.className = 'cm-item';

                const avatar = document.createElement('div');
                avatar.className = 'cm-avatar';
                avatar.textContent = name.charAt(0) || '?';
                avatar.style.background = avatarColor(name);

                const main = document.createElement('div');
                main.className = 'cm-main';

                const bubble = document.createElement('div');
                bubble.className = 'cm-bubble';
                const nameEl = document.createElement('span');
                nameEl.className = 'cm-name';
                nameEl.textContent = name;
                const textEl = document.createElement('p');
                textEl.className = 'cm-text';
                textEl.textContent = c.comment_text;
                bubble.append(nameEl, textEl);

                const meta = document.createElement('div');
                meta.className = 'cm-meta';
                const time = document.createElement('span');
                time.textContent = timeAgo(c.created_at);
                meta.appendChild(time);

                // Edit / Delete: yaada ofiisaaf qofa
                if (myId && c.user_id === myId) {
                    meta.append(
                        makeCommentAction('Edit', () => startEditComment(c, bubble, meta)),
                        makeCommentAction('Delete', () => deleteComment(c.id))
                    );
                }

                main.append(bubble, meta);
                item.append(avatar, main);
                list.appendChild(item);
            });

            list.scrollTop = scrollToBottom ? list.scrollHeight : prevScroll;

            const countEl = document.getElementById('comment-count');
            const headingCountEl = document.getElementById('comment-heading-count');
            if (countEl) countEl.innerText = data.length;
            if (headingCountEl) headingCountEl.innerText = data.length;
        }
    } catch (e) {
        console.error("Load comments error:", e);
    }
}

function startEditComment(c, bubble, meta) {
    const box = document.createElement('div');
    box.className = 'cm-edit-box';
    const ta = document.createElement('textarea');
    ta.value = c.comment_text;
    ta.maxLength = 1000;
    box.appendChild(ta);
    bubble.replaceWith(box);
    ta.focus();

    meta.innerHTML = '';
    meta.append(
        makeCommentAction('Save', async () => {
            const newText = ta.value.trim();
            if (!newText) {
                alert("Yaadni duwwaa ta'uu hin danda'u!");
                return;
            }
            try {
                const { data, error } = await sbClient
                    .from('comments')
                    .update({ comment_text: newText })
                    .eq('id', c.id)
                    .select();
                if (error) {
                    alert("Rakkina Database: " + error.message);
                } else if (!data || data.length === 0) {
                    alert("Yaada kana jijjiiruuf hayyama hin qabdu.");
                } else {
                    loadComments();
                }
            } catch (e) {
                alert("Dogoggora: " + e.message);
            }
        }),
        makeCommentAction('Cancel', () => loadComments())
    );
}

async function deleteComment(id) {
    if (!confirm("Yaada kana haquu barbaaddaa?")) return;
    try {
        const { data, error } = await sbClient
            .from('comments')
            .delete()
            .eq('id', id)
            .select();
        if (error) {
            alert("Rakkina Database: " + error.message);
        } else if (!data || data.length === 0) {
            alert("Yaada kana haquuf hayyama hin qabdu.");
        } else {
            loadComments();
        }
    } catch (e) {
        alert("Dogoggora: " + e.message);
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

window.addEventListener('DOMContentLoaded', () => {
    setPasswordVisible(false);
    setTimeout(() => {
        loadReactions();
        loadComments();
        updateSaveButtonVisual();
        updateAuthUI();
    }, 600);
});
