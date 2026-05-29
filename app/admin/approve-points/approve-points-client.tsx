'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'

interface Award {
  id: string
  user_id: string
  staff_id: string
  points: number
  award_type: string
  reason: string
  notes: string
  proof_image_url: string | null
  status: string
  created_at: string
  approved_at?: string
  rejection_reason?: string
  users: {
    first_name: string
    last_name: string
    email?: string
  }
  staff: {
    first_name: string
    last_name: string
  }
  approver?: {
    first_name: string
    last_name: string
  }
}

interface ApprovePointsClientProps {
  pendingAwards: Award[]
  approvedAwards: Award[]
  rejectedAwards: Award[]
  adminId: string
}

export function ApprovePointsClient({
  pendingAwards: initialPending,
  approvedAwards,
  rejectedAwards,
  adminId
}: ApprovePointsClientProps) {
  const [pendingAwards, setPendingAwards] = useState(initialPending)
  const [processing, setProcessing] = useState<string | null>(null)
  const [viewingProof, setViewingProof] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = mounted ? new Date() : new Date(timestamp)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const handleApprove = async (award: Award) => {
    setProcessing(award.id)
    try {
      const response = await fetch('/api/admin/approve-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awardId: award.id,
          action: 'approve',
          adminId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve')
      }

      toast({
        title: '✅ Approved!',
        description: `${award.users.first_name} received ${award.points} beans!`,
      })

      // Remove from pending list
      setPendingAwards(prev => prev.filter(a => a.id !== award.id))
      
      // Refresh page data
      router.refresh()

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (award: Award) => {
    const reason = prompt('Reason for rejection (optional):')
    
    setProcessing(award.id)
    try {
      const response = await fetch('/api/admin/approve-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          awardId: award.id,
          action: 'reject',
          adminId,
          rejectionReason: reason
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject')
      }

      toast({
        title: '❌ Rejected',
        description: 'Award request has been rejected',
      })

      // Remove from pending list
      setPendingAwards(prev => prev.filter(a => a.id !== award.id))
      
      // Refresh page data
      router.refresh()

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setProcessing(null)
    }
  }

  const getAwardTypeName = (type: string) => {
    const types: Record<string, string> = {
      social_media_share: '📱 Social Media Share',
      referral_bonus: '👥 Referral Bonus',
      birthday_bonus: '🎂 Birthday Bonus',
      event_participation: '🎉 Event Participation',
      survey_completion: '📝 Survey Completion',
      complaint_resolution: '💬 Complaint Resolution',
      custom_amount: '✏️ Custom Amount'
    }
    return types[type] || type
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-yellow-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            ⏳ Approve Manual Beans
          </h1>
        </div>

        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>⏳ Pending Approvals ({pendingAwards.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAwards.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <p className="text-gray-500">No pending approvals! 🎉</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAwards.map((award) => (
                  <Card key={award.id} className="border-2 border-orange-200 bg-orange-50">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {award.users.first_name} {award.users.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">{award.users.email}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600">
                              {award.points} beans
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(award.created_at)}
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Type:</span>
                            <span>{getAwardTypeName(award.award_type)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Staff:</span>
                            <span>{award.staff.first_name} {award.staff.last_name}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-medium">Reason:</span>
                            <span className="flex-1">{award.reason}</span>
                          </div>
                          {award.notes && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium">Notes:</span>
                              <span className="flex-1 text-gray-600">{award.notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Proof Image */}
                        {award.proof_image_url && (
                          <div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingProof(award.proof_image_url)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Proof Photo
                            </Button>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApprove(award)}
                            disabled={processing === award.id}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(award)}
                            disabled={processing === award.id}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Approved */}
        {approvedAwards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>✅ Recently Approved ({approvedAwards.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {approvedAwards.map((award) => (
                  <div 
                    key={award.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {award.users.first_name} {award.users.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {award.points} beans - {getAwardTypeName(award.award_type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(award.approved_at || award.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recently Rejected */}
        {rejectedAwards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>❌ Recently Rejected ({rejectedAwards.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rejectedAwards.map((award) => (
                  <div 
                    key={award.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {award.users.first_name} {award.users.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {award.points} beans - {getAwardTypeName(award.award_type)}
                        </p>
                        {award.rejection_reason && (
                          <p className="text-xs text-red-600">
                            Reason: {award.rejection_reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTime(award.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Proof Image Modal */}
      {viewingProof && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingProof(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <img 
              src={viewingProof} 
              alt="Proof" 
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <Button
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={() => setViewingProof(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
