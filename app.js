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

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const titleEl = document.getElementById('auth-modal-title');
    const switchEl = document.getElementById('auth-switch-text');
    if (titleEl && switchEl) {
        if (isSignUpMode) {
            titleEl.innerText = "Create an Account (Sign Up)";
            switchEl.innerText = "Already have an account? Sign In";
        } else {
            titleEl.innerText = "Sign In to Your Account";
            switchEl.innerText = "Don't have an account? Sign Up";
        }
    }
}

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
            alert("Milkaa'inaan react godheetta! 👍");
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
async function submitComment() {
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
            alert("Yaadni kee milkaa'inaan nannaa'eera! 💬");
            loadComments();
        } else {
            alert("Rakkina Database: " + error.message);
        }
    } catch (e) {
        console.error("Comment submit error:", e);
        alert("Dogoggora: " + e.message);
    }
}

function makeCommentAction(label, onClick) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'background:none; border:none; padding:0; font-size:12px; cursor:pointer; color:#999;';
    b.addEventListener('click', onClick);
    return b;
}

async function loadComments() {
    try {
        if (typeof sbClient === 'undefined') return;
        const slug = getPostSlug();

        const { data: sessionData } = await sbClient.auth.getSession();
        const myId = sessionData?.session?.user?.id;

        const { data, error } = await sbClient
            .from('comments')
            .select('*')
            .eq('post_slug', slug)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const list = document.getElementById('comment-list');
            if (!list) return;
            list.innerHTML = '';

            data.forEach(c => {
                const div = document.createElement('div');
                const isLight = document.body.classList.contains('light-mode');
                div.style.cssText = isLight
                    ? 'background:#f5f5f5; border-radius:10px; padding:12px; margin-bottom:10px; text-align:left; border-left: 3px solid #000000;'
                    : 'background:#1a1a1a; border-radius:10px; padding:12px; margin-bottom:10px; text-align:left; border-left: 3px solid #ffffff;';
                const nameColor = isLight ? '#000000' : '#ffffff';
                const textColor = isLight ? '#333' : '#ccc';

                const nameEl = document.createElement('strong');
                nameEl.style.color = nameColor;
                nameEl.textContent = c.user_name || (c.user_email ? c.user_email.split('@')[0] : 'User');
                const textEl = document.createElement('p');
                textEl.style.cssText = `color:${textColor}; margin:6px 0 0; font-size:14px;`;
                textEl.textContent = c.comment_text;
                div.append(nameEl, textEl);

                // Edit / Delete: yaada ofiisaaf qofa
                if (myId && c.user_id === myId) {
                    const actions = document.createElement('div');
                    actions.style.cssText = 'margin-top:8px; display:flex; gap:16px;';
                    actions.append(
                        makeCommentAction('✏️ Edit', () => startEditComment(c, textEl, actions, isLight)),
                        makeCommentAction('🗑 Delete', () => deleteComment(c.id))
                    );
                    div.append(actions);
                }

                list.appendChild(div);
            });

            const countEl = document.getElementById('comment-count');
            const headingCountEl = document.getElementById('comment-heading-count');
            if (countEl) countEl.innerText = data.length;
            if (headingCountEl) headingCountEl.innerText = data.length;
        }
    } catch (e) {
        console.error("Load comments error:", e);
    }
}

function startEditComment(c, textEl, actions, isLight) {
    const ta = document.createElement('textarea');
    ta.value = c.comment_text;
    ta.style.cssText = `width:100%; box-sizing:border-box; height:80px; resize:none; margin-top:6px; padding:8px; font-size:14px; border-radius:8px; outline:none; border:1px solid ${isLight ? '#ccc' : '#555'}; background:${isLight ? '#fff' : '#111'}; color:${isLight ? '#000' : '#fff'};`;
    textEl.replaceWith(ta);
    ta.focus();

    actions.innerHTML = '';
    actions.append(
        makeCommentAction('💾 Save', async () => {
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
        makeCommentAction('✖ Cancel', () => loadComments())
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
    setTimeout(() => {
        loadReactions();
        loadComments();
        updateSaveButtonVisual();
        updateAuthUI();
    }, 600);
});
