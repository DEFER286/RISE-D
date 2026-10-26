// Supabase client
const SUPABASE_URL = 'https://wqamfdzbgffozenubbdh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n1RLKJeu056oBwQXRoIgIg_fVrQkQ30';

// Maqaan "sbClient" fayyadama, akka maqaa "supabase" (CDN) waliin hin walitti bu'inee
window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
