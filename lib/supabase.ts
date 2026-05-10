import { createClient } from '@supabase/supabase-js'

// 🔥 Safe URL extraction with build-time fallback
const getSupabaseUrl = (): string => {
  if (typeof window === 'undefined') {
    // Server-side/build-time: use fallback to avoid prerender crash
    return process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sizjvqxsrjzffylvuysb.supabase.co'
  }
  // Client-side: use env var directly
  return process.env.NEXT_PUBLIC_SUPABASE_URL!
}

// 🔥 Safe key extraction
const getSupabaseKey = (): string => {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpemp2cXhzcmp6ZmZ5bHZ1eXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTc0MTQsImV4cCI6MjA5MzgzMzQxNH0.cWLeSIqDBS9ZyEnl_cFm6Qsmi0MWXkBilylswiv0Nxo'
}

// Validate URL format before creating client
const supabaseUrl = getSupabaseUrl().trim()
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.endsWith('.supabase.co')) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`)
}

export const supabase = createClient(
  supabaseUrl,
  getSupabaseKey().trim(),
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)