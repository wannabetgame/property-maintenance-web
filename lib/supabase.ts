import { createClient } from '@supabase/supabase-js'

// 🔥 Safe URL extraction with validation
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  
  // Validate: must start with https:// and end with .supabase.co
  if (!url || !url.startsWith('https://') || !url.endsWith('.supabase.co')) {
    // Fallback for build-time safety (won't work at runtime, but won't crash build)
    return 'https://sizjvqxsrjzffylvuysb.supabase.co'
  }
  return url
}

// 🔥 Safe key extraction
const getSupabaseKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  // Fallback placeholder (will fail at runtime if env var missing, but build succeeds)
  return key || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpemp2cXhzcmp6ZmZ5bHZ1eXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTc0MTQsImV4cCI6MjA5MzgzMzQxNH0.cWLeSIqDBS9ZyEnl_cFm6Qsmi0MWXkBilylswiv0Nxo'
}

export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseKey(),
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)