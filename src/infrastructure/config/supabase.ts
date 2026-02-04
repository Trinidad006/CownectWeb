import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rovlcrdgjinpfudyoovg.supabase.co'
const supabaseAnonKey = 'sb_publishable_0OEAd3Jq5tEUvUV_S4n8Yg_Yk_SP8LJ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

