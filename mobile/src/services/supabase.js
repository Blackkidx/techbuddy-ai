// mobile/src/services/supabase.js
// Supabase Client สำหรับ Mobile App (ใช้ Anon/Public Key)

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://mlhipwjgqulmebssajgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saGlwd2pncXVsbWVic3NhamdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzg4ODUsImV4cCI6MjA4OTk1NDg4NX0.bI54XKRHn2lmwpqO_TZzeitz3PCxYjrTGtp0-PJO598';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('✅ Supabase Mobile Client initialized');

export default supabase;
