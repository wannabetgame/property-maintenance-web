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
  tenant: { email: string } | null
  photos: { storage_path: string }[]
}

export default function OwnerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [handymen, setHandymen] = useState<{ id: string; email: string }[]>([])

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login')
      else fetchOrders()
    }
  }, [user, authLoading, router])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        tenant:users!work_orders_tenant_id_fkey (email),
        photos (storage_path)
      `)
      .in('status', ['submitted', 'approved', 'in_progress'])
      .order('sla_deadline', { ascending: true })

    if (error) console.error('Fetch orders error:', error)
    else setOrders(data || [])
    setLoading(false)
  }

  const fetchHandymen = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'handyman')
    if (data) setHandymen(data)
  }

  const updateStatus = async (orderId: string, newStatus: WorkOrder['status']) => {
    const { error } = await supabase
      .from('work_orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    
    if (!error) {
      fetchOrders()
      setSelectedOrder(null)
    }
  }

  const assignHandyman = async (orderId: string, handymanId: string) => {
    setAssigning(orderId)
    const { error } = await supabase
      .from('work_orders')
      .update({ 
        assigned_handyman_id: handymanId, 
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (!error) {
      fetchOrders()
      setSelectedOrder(null)
    }
    setAssigning(null)
  }

  const getSLAColor = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const hoursLeft = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursLeft < 2) return 'text-red-600 font-bold animate-pulse'
    if (hoursLeft < 8) return 'text-amber-600 font-medium'
    return 'text-green-600'
  }

  const formatTimeLeft = (deadline: string) => {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()
    
    if (diff <= 0) return 'OVERDUE'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${mins}m left`
  }

  if (authLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🏠 Owner Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage maintenance requests for your properties</p>
          </div>
          <button onClick={signOut} className="mt-4 md:mt-0 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition">
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{orders.filter(o => o.status === 'submitted').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'in_progress').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <p className="text-sm text-gray-500">Urgent</p>
            <p className="text-2xl font-bold text-red-600">{orders.filter(o => o.priority === 'emergency').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
        </div>

        {/* Work Orders List */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Active Work Orders</h2>
          </div>
          
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              🎉 No pending requests. All caught up!
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div key={order.id} className="p-4 md:p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.priority === 'emergency' ? 'bg-red-100 text-red-800' :
                          order.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                          order.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 truncate">{order.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{order.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>👤 {order.tenant?.email || 'Unknown tenant'}</span>
                        <span>📅 {new Date(order.created_at).toLocaleDateString()}</span>
                        <span className={getSLAColor(order.sla_deadline)}>
                          ⏱️ {formatTimeLeft(order.sla_deadline)}
                        </span>
                        {order.photos?.length > 0 && (
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            📷 {order.photos.length} photo{order.photos.length > 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 md:flex-col">
                      {order.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => updateStatus(order.id, 'approved')}
                            className="px-3 py-1.5 rounded bg-green-600 text-white text-sm hover:bg-green-700 transition"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => updateStatus(order.id, 'rejected')}
                            className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition"
                          >
                            ❌ Reject
                          </button>
                        </>
                      )}
                      
                      {order.status === 'approved' && (
                        <div className="flex flex-col gap-2">
                          <select
                            onChange={(e) => e.target.value && assignHandyman(order.id, e.target.value)}
                            value={assigning === order.id ? '' : ''}
                            className="px-3 py-1.5 rounded border text-sm bg-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">👷 Assign Handyman</option>
                            {handymen.map(h => (
                              <option key={h.id} value={h.id}>{h.email}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => { fetchHandymen(); setAssigning(order.id) }}
                            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                          >
                            Refresh List
                          </button>
                        </div>
                      )}
                      
                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="px-3 py-1.5 rounded bg-gray-600 text-white text-sm hover:bg-gray-700 transition"
                        >
                          ✅ Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Photos for: {selectedOrder.title}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {selectedOrder.photos?.map((photo, idx) => (
                <img 
                  key={idx}
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/work-order-photos/${photo.storage_path}`}
                  alt="Work order"
                  className="rounded-lg border object-cover aspect-square"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}