import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pdczkwhfmmknxynxdpvk.supabase.co"
const supabaseKey = "sb_publishable_MtqDuWiSMLSwQZbNwaIqOA_ClSxIBx0"

export const supabase = createClient(supabaseUrl, supabaseKey)