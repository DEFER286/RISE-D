// 1. Supabase Client safe aんだけど uumuu
const SUPABASE_URL = 'https://wqamfdzbgffozenubbdh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_n1RLKJeu056oBwQXRoIgIg_fVrQkQ30';

// Global window object irratti qabsiisuun akka app.js keessatti hojjetu gochuu
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
