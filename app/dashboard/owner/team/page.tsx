'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TeamManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [handymen, setHandymen] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // ✅ FIXED: Added "data:" alias
    const { data: bData } = await supabase.from('buildings').select('id, name')
    if (bData) setBuildings(bData)

    // ✅ FIXED: Added "data:" alias
    const { data: hData } = await supabase
      .from('users')
      .select(`id, email, building_id, buildings(name)`)
      .eq('role', 'handyman')
    if (hData) setHandymen(hData)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !selectedBuilding) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      // ✅ FIXED: Added "data:" alias for auth response
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData?.user) throw new Error('User creation failed')

      // 2. Add to users table
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email,
        role: 'handyman',
        building_id: selectedBuilding,
      })

      if (profileError) throw profileError

      alert('Handyman account created successfully!')
      setEmail('')
      setPassword('')
      setSelectedBuilding('')
      loadData()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">👥 Team Management</h1>
            <p className="text-gray-500 mt-1">Invite and manage handymen</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invite Form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">➕ Invite New Handyman</h2>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="handyman@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Set a secure password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Building</label>
                <div className="space-y-2">
                  {buildings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBuilding(b.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                        selectedBuilding === b.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-black py-3 text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Handyman Account'}
              </button>
            </form>
          </div>

          {/* Current Team List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              👷 Current Team ({handymen.length})
            </h2>
            
            {handymen.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No handymen yet</p>
                <p className="text-sm mt-1">Invite your first handyman using the form</p>
              </div>
            ) : (
              <div className="space-y-3">
                {handymen.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{h.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                         {h.buildings?.name || 'No building assigned'}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}