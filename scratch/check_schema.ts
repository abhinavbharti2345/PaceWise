import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function check() {
  const { data, error } = await supabase.rpc('get_foreign_keys');
  if (error) {
    console.error('RPC failed, trying information_schema... you cannot query information_schema from anon key usually.');
    console.log(error);
  }
}
check();
