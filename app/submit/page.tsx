'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { supabase } from '@/lib/supabase'

export default function SubmitWorkOrderPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium')
  const [propertyId, setPropertyId] = useState('')
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      const fetchProperties = async () => {
        console.log('👤 Fetching properties for user:', user.id, user.email)
        
        const { data, error } = await supabase
          .from('properties')
          .select('id, name')
        
        if (error) {
          console.error('❌ Property fetch error:', error.message)
          setMessage(`⚠️ Error loading properties: ${error.message}`)
        } else {
          console.log('📦 Fetched properties:', data)
          if (data && data.length > 0) {
            setProperties(data)
            setPropertyId(data[0].id)
          } else {
            setMessage('⚠️ No properties assigned. Contact admin or verify account link.')
          }
        }
      }
      fetchProperties()
    } else if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !propertyId) return
    setLoading(true)
    setMessage('')

    try {
      const { data: workOrder, error: woError } = await supabase
        .from('work_orders')
        .insert({ tenant_id: user.id, property_id: propertyId, title, description, priority })
        .select()
        .single()

      if (woError) throw woError

      if (photoFile && workOrder) {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${workOrder.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('work-order-photos')
          .upload(fileName, photoFile)

        if (uploadError) throw uploadError

        await supabase.from('photos').insert({
          work_order_id: workOrder.id,
          uploaded_by: user.id,
          storage_path: fileName,
          caption: title
        })
      }

      setMessage('✅ Work order submitted! Owner & handyman notified.')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (error: any) {
      setMessage(`❌ ${error.message || 'Submission failed'}`)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-xl rounded-xl border bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold">🔧 Submit Maintenance Request</h1>
        <p className="mb-6 text-sm text-gray-500">Include details & photos for faster resolution.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {properties.length > 0 ? (
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full rounded-lg border px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
              {message || '⚠️ No properties assigned.'}
            </div>
          )}

          <input type="text" placeholder="Issue Title (e.g., Leaky Faucet)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <textarea placeholder="Describe the issue, location, and urgency..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full rounded-lg border px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="low">🟢 Low</option><option value="medium">🟡 Medium</option><option value="high">🟠 High</option><option value="emergency">🔴 Emergency</option>
          </select>
          <div className="flex items-center gap-2 rounded-lg border p-3 bg-gray-50">
            <label className="cursor-pointer text-blue-600 hover:underline font-medium">📷 Attach Photo<input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} className="hidden" /></label>
            {photoFile && <span className="text-sm text-gray-600 truncate">{photoFile.name}</span>}
          </div>
          <button type="submit" disabled={loading || !propertyId} className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        {message && !properties.length && (
          <p className="mt-4 text-center text-sm font-medium text-amber-600">{message}</p>
        )}
      </div>
    </div>
  )
}