'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { supabase } from '@/lib/supabase'

type WorkOrder = {
  id: string
  title: string
  description: string
  priority: string
  status: string
  sla_deadline: string
  created_at: string
  assigned_handyman_id: string | null
  photos: { id: string; storage_path: string; caption: string }[]
}

export default function TenantDashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [newPhoto, setNewPhoto] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login')
      else fetchOrders()
    }
  }, [user, authLoading, router])

  const fetchOrders = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, photos (id, storage_path, caption)')
      .eq('tenant_id', user.id)
      .order('created_at', { ascending: false })

    if (error) console.error('Fetch error:', error)
    else setOrders(data || [])
    setLoading(false)
  }

  const handleUpload = async () => {
    if (!selectedOrder || !newPhoto || !user) return
    setUploading(true)
    try {
      const ext = newPhoto.name.split('.').pop()
      const path = `${selectedOrder.id}/follow-up/${Date.now()}.${ext}`
      
      const { error: uploadErr } = await supabase.storage
        .from('work-order-photos')
        .upload(path, newPhoto, { upsert: true })
      if (uploadErr) throw uploadErr

      await supabase.from('photos').insert({
        work_order_id: selectedOrder.id,
        uploaded_by: user.id,
        storage_path: path,
        caption: 'Follow-up photo'
      })

      setNewPhoto(null)
      await fetchOrders()
      alert('✅ Photo uploaded successfully')
    } catch (err: any) {
      alert('❌ Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      submitted: 'bg-amber-100 text-amber-800',
      approved: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return map[status] || 'bg-gray-100 text-gray-800'
  }

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return 'OVERDUE'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m left`
  }

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">🏡 My Maintenance Requests</h1>
            <p className="text-gray-600 text-sm mt-1">Track status, SLA deadlines, and upload follow-up photos</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/submit')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
              + New Request
            </button>
            <button onClick={signOut} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm">
              Sign Out
            </button>
          </div>
        </div>

        {/* Order List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500 border shadow-sm">
              No requests yet. Click <span className="font-medium text-blue-600">+ New Request</span> to submit one.
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">{order.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{order.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                  <span>🔴🟡🟢 Priority: {order.priority}</span>
                  <span className={getTimeLeft(order.sla_deadline).includes('OVERDUE') ? 'text-red-600 font-bold' : 'text-green-600'}>
                    ⏱️ {getTimeLeft(order.sla_deadline)}
                  </span>
                  {order.assigned_handyman_id && (
                    <span>👷 Handyman assigned</span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedOrder(order)}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  View Details & Upload Photos →
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail/Upload Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1">{selectedOrder.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{selectedOrder.description}</p>
            
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-xs uppercase tracking-wide text-gray-500">Attached Photos</h4>
              {selectedOrder.photos?.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedOrder.photos.map(p => (
                    <img
                      key={p.id}
                      src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/work-order-photos/${p.storage_path}`}
                      alt="Photo"
                      className="rounded-lg border object-cover h-32 w-full"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No photos attached yet.</p>
              )}
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium mb-2">Add Follow-up Photo</label>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setNewPhoto(e.target.files?.[0] || null)}
                  className="text-sm w-full"
                />
                <button
                  onClick={handleUpload}
                  disabled={!newPhoto || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setSelectedOrder(null)} 
              className="mt-4 w-full py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}