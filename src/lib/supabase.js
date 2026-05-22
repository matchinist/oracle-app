import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mgfzqkesikfdrahherfm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZnpxa2VzaWtmZHJhaGhlcmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjA5ODAsImV4cCI6MjA5NTAzNjk4MH0.uzhqaPtsEE-dthbpv1tl6krZj7FidfTblV_7ilcAxFI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
