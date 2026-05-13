'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface WorkOrder {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  buildings?: { name: string }
  tenants?: { email: string }
  handymen?: { email: string }
}

// Helper component for status colors
const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export default function WorkOrdersPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      // Fetch jobs with details from related tables
      const {  data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          buildings(name),
          tenants:tenant_id(email),
          handymen:assigned_handyman_id(email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (err: any) {
      alert('Error loading jobs: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading work orders...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 Work Orders</h1>
            <p className="text-gray-500 mt-1">Monitor maintenance requests across all properties</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back
          </button>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No work orders yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-start gap-6">
                
                {/* Status & ID */}
                <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3">
                  <StatusBadge status={job.status} />
                  <span className="text-xs text-gray-400 font-mono hidden md:block">{job.id.slice(0, 8)}</span>
                </div>

                {/* Job Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title || 'Untitled Job'}</h3>
                  <p className="text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-gray-400">🏢</span>
                      <span className="font-medium">{job.buildings?.name || 'Unknown Building'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-gray-400"></span>
                      <span className="font-medium">Tenant: {job.tenants?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="text-gray-400">🔧</span>
                      <span className="font-medium">Handyman: {job.handymen?.email || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <button 
                    onClick={() => alert(`🔧 Job ${job.id} details coming soon!`)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}