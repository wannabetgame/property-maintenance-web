'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Building {
  id: string
  name: string
  address: string | null
  tenant_count: number
}

export default function BuildingsPage() {
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newBuildingName, setNewBuildingName] = useState('')
  const [newBuildingAddress, setNewBuildingAddress] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBuildings()
  }, [])

  const fetchBuildings = async () => {
    try {
      // 1. Fetch buildings
      const { data: buildingsData, error: bError } = await supabase
        .from('buildings')
        .select('id, name, address')
      if (bError) throw bError

      // 2. Fetch tenants to count per building
      const { data: tenantsData } = await supabase
        .from('users')
        .select('building_id')
        .eq('role', 'tenant')

      // 3. Map counts client-side
      const mapped = (buildingsData || []).map(b => ({
        ...b,
        tenant_count: tenantsData?.filter(t => t.building_id === b.id).length || 0
      }))

      setBuildings(mapped)
    } catch (err: any) {
      alert('Error loading buildings: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBuilding = async () => {
    if (!newBuildingName.trim()) return alert('Building name is required')
    setSaving(true)
    try {
      const { error } = await supabase.from('buildings').insert({
        name: newBuildingName.trim(),
        address: newBuildingAddress.trim() || null
      })
      if (error) throw error
      
      setShowAddModal(false)
      setNewBuildingName('')
      setNewBuildingAddress('')
      fetchBuildings()
    } catch (err: any) {
      alert('Error adding building: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading buildings...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏘️ Buildings</h1>
            <p className="text-gray-500 mt-1">Manage your properties and tenant assignments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition"
            >
              + Add Building
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Buildings Grid */}
        {buildings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No buildings added yet.</p>
            <p className="text-gray-400 mt-2">Click "Add Building" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((b) => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:border-blue-300 transition">
                <h3 className="text-xl font-semibold text-gray-900">{b.name}</h3>
                <p className="text-gray-500 mt-1">{b.address || 'No address specified'}</p>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-600">👥 {b.tenant_count} Tenants</span>
                  <button
                    onClick={() => alert('🏗️ Building details & tenant assignment coming next!')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Building Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Building</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name</label>
                <input
                  type="text"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Sunset Apartments"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                <input
                  type="text"
                  value={newBuildingAddress}
                  onChange={(e) => setNewBuildingAddress(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 123 Main St"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBuilding}
                  disabled={saving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Building'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}