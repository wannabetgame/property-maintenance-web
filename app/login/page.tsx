'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'tenant' | 'owner' | 'handyman' | 'admin'>('tenant')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignup) {
        // Pass role in metadata so the DB trigger can read it
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { role: role } }
        })
        if (error) throw error
        
        if (data.user) {
          setMessage('✅ Account created! Logging you in...')
          // Auto-login immediately after signup
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
          if (signInError) throw signInError
          router.push('/dashboard')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (error: any) {
      setMessage(`❌ ${error.message || 'Something went wrong'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-center">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">Property Maintenance Portal</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {isSignup && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full rounded-lg border px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tenant">Tenant</option>
              <option value="owner">Owner / Manager</option>
              <option value="handyman">Handyman</option>
              <option value="admin">Admin</option>
            </select>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Processing...' : isSignup ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <button
          onClick={() => { setIsSignup(!isSignup); setMessage('') }}
          className="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
        >
          {isSignup ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  )
}