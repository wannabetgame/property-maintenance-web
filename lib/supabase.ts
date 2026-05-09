import { createClient } from '@supabase/supabase-js'

// ✅ CORRECT: Base URL ONLY - no /rest/v1, no trailing slash
const supabaseUrl = 'https://sizjvqxsrjzffylvuysb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpemp2cXhzcmp6ZmZ5bHZ1eXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTc0MTQsImV4cCI6MjA5MzgzMzQxNH0.cWLeSIqDBS9ZyEnl_cFm6Qsmi0MWXkBilylswiv0Nxo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)