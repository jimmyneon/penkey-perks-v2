'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X as CloseIcon } from 'lucide-react'

interface NotificationPreviewProps {
  data: {
    title: string
    message: string
    icon: string
    variant: string
    dismissible: boolean
  }
  onClose: () => void
}

export function NotificationPreview({ data, onClose }: NotificationPreviewProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-gradient-to-r from-orange-500/10 to-orange-100/30 border-orange-500/30',
    streak: 'bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 border-orange-500/50 animate-pulse',
    success: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30',
    reward: 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-500'
  }

  const variantClass = variantStyles[data.variant] || variantStyles.default

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Preview</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600">
          This is how your notification will appear to users:
        </p>

        {/* Preview */}
        <Card className={`border-2 ${variantClass} relative`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1 text-2xl">
                {data.icon}
              </div>
              
              {/* Message */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {data.title || 'Notification Title'}
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {data.message || 'Notification message will appear here...'}
                </p>
              </div>

              {/* Dismiss Button */}
              {data.dismissible && (
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Variant:</span>
          <span className="capitalize">{data.variant}</span>
          <span className="mx-2">•</span>
          <span className="font-medium">Dismissible:</span>
          <span>{data.dismissible ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  )
}
