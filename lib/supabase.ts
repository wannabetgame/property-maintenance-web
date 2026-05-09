import { createClient } from '@supabase/supabase-js'

// 🔥 HARDCODED - Cannot fail, no env vars involved
export const supabase = createClient(
  'https://sizjvqxsrjzffylvuysb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpemp2cXhzcmp6ZmZ5bHZ1eXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTc0MTQsImV4cCI6MjA5MzgzMzQxNH0.cWLeSIqDBS9ZyEnl_cFm6Qsmi0MWXkBilylswiv0Nxo',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        // Explicitly ensure apikey header is sent
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpemp2cXhzcmp6ZmZ5bHZ1eXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTc0MTQsImV4cCI6MjA5MzgzMzQxNH0.cWLeSIqDBS9ZyEnl_cFm6Qsmi0MWXkBilylswiv0Nxo'
      }
    }
  }
)