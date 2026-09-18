// import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = "https://psgyanmneunqifqmvzkr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5fFTQWGDwnQTcOi95lzVzg_iOalzs5V";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);