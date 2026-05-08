'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { supabase } from '@/lib/supabase'

type WorkOrder = {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'emergency'
  status: 'submitted' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  sla_deadline: string
  created_at: string
  tenant_email: string | null
  property_name: string | null
  photos: { id: string; storage_path: string; caption: string }[]
}

export default function HandymanDashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [newPhoto, setNewPhoto] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

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
      .select(`
        *,
        tenant:users!work_orders_tenant_id_fkey (email),
        property:properties (name),
        photos (id, storage_path, caption)
      `)
      .eq('assigned_handyman_id', user.id)
      .in('status', ['approved', 'in_progress'])
      .order('sla_deadline', { ascending: true })

    if (error) console.error('Fetch error:', error)
    else setOrders(data || [])
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: WorkOrder['status']) => {
    setActionLoading(true)
    const { error } = await supabase
      .from('work_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    
    if (!error) await fetchOrders()
    setActionLoading(false)
  }

  const uploadPhoto = async () => {
    if (!selectedOrder || !newPhoto || !user) return
    setUploading(true)
    try {
      const ext = newPhoto.name.split('.').pop()
      const path = `${selectedOrder.id}/handyman-completion/${Date.now()}.${ext}`
      
      const { error: uploadErr } = await supabase.storage
        .from('work-order-photos')
        .upload(path, newPhoto, { upsert: true })
      if (uploadErr) throw uploadErr

      await supabase.from('photos').insert({
        work_order_id: selectedOrder.id,
        uploaded_by: user.id,
        storage_path: path,
        caption: 'Completion photo'
      })

      setNewPhoto(null)
      await fetchOrders()
      alert('✅ Completion photo uploaded')
    } catch (err: any) {
      alert('❌ Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const getUrgencyColor = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    const hours = diff / 3600000
    if (hours < 0) return 'bg-red-100 text-red-800 border-red-200'
    if (hours < 4) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    if (diff <= 0) return '⚠️ OVERDUE'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `⏱️ ${h}h ${m}m left`
  }

  if (authLoading || loading) return <div className="flex min-h-screen items-center justify-center">Loading jobs...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">🛠️ My Assigned Jobs</h1>
            <p className="text-gray-600 text-sm mt-1">Track deadlines, update status, and upload proof</p>
          </div>
          <button onClick={signOut} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm">
            Sign Out
          </button>
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500 border shadow-sm">
              ✅ No active assignments. Check back later.
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">{order.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getUrgencyColor(order.sla_deadline)}`}>
                    {getTimeLeft(order.sla_deadline)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{order.description}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  <span>👤 {order.tenant?.email || 'Tenant hidden'}</span>
                  <span>📍 {order.property?.name || 'Property TBD'}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    order.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(order.id, 'in_progress')}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
                    >
                      🟢 Start Job
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
                  >
                    📷 View / Upload Photo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Photo & Completion Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1">{selectedOrder.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{getTimeLeft(selectedOrder.sla_deadline)}</p>
            
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-xs uppercase tracking-wide text-gray-500">Existing Photos</h4>
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

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-xs uppercase tracking-wide text-gray-500">Upload Completion Photo</h4>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setNewPhoto(e.target.files?.[0] || null)}
                  className="text-sm w-full"
                />
                <button
                  onClick={uploadPhoto}
                  disabled={!newPhoto || uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium whitespace-nowrap"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>

              {selectedOrder.status === 'in_progress' && (
                <button
                  onClick={() => { updateStatus(selectedOrder.id, 'completed'); setSelectedOrder(null); }}
                  disabled={actionLoading}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium transition mt-2"
                >
                  ✅ Mark Job Complete
                </button>
              )}
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