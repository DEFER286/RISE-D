// 1. Logic fi Functions (Reaction handle gochuuf)
async function handleReaction(type) {
    // Dursa namni seeneeraa (login) mirkaneessi
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        alert("React gochuuf dursa Sign Up ykn Login godhadhu!");
        document.getElementById('auth-modal').style.display = 'block';
        return;
    }

    // Database Supabase-tti erguu
    const { data, error } = await supabase
        .from('reactions')
        .insert([{ post_slug: currentPostSlug, reaction_type: type, user_id: user.id }]);

    if (!error) {
        alert("Milkaa'inaan react godheetta!");
    } else {
        alert("Rakkina: " + error.message);
    }
}
