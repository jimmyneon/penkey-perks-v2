'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Send, Sparkles, Gift, Coffee, TrendingUp, Gamepad2, Star, Heart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MessagesClientProps {
  staffId: string
  staffName: string
}

const messageTemplates = [
  {
    id: 'happy_hour',
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Happy Hour Alert',
    message: 'Happy Hour is NOW! Come grab your favorite coffee at 20% off for the next 2 hours!',
    color: 'from-amber-50 to-orange-100'
  },
  {
    id: 'new_reward',
    icon: <Gift className="w-5 h-5" />,
    title: 'New Reward Available',
    message: 'Good news! You have a new reward waiting for you. Pop by Penkey to redeem it!',
    color: 'from-yellow-50 to-amber-100'
  },
  {
    id: 'stamp_reminder',
    icon: <Coffee className="w-5 h-5" />,
    title: 'Stamp Card Reminder',
    message: 'You\'re so close! Just {stampsLeft} more stamps until your free coffee!',
    color: 'from-orange-50 to-amber-100'
  },
  {
    id: 'daily_game',
    icon: <Gamepad2 className="w-5 h-5" />,
    title: 'Daily Game Ready',
    message: 'Your daily game is ready! Play now for a chance to win bonus points!',
    color: 'from-amber-50 to-yellow-100'
  },
  {
    id: 'special_offer',
    icon: <Star className="w-5 h-5" />,
    title: 'Special Offer',
    message: 'Special offer just for you! Show this message at the counter for a surprise treat!',
    color: 'from-yellow-50 to-orange-100'
  },
  {
    id: 'thank_you',
    icon: <Heart className="w-5 h-5" />,
    title: 'Thank You',
    message: 'Thank you for being an amazing customer! Your support means the world to us!',
    color: 'from-amber-50 to-orange-50'
  }
]

export function MessagesClient({ staffId, staffName }: MessagesClientProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<typeof messageTemplates[0] | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  const handleSelectTemplate = (template: typeof messageTemplates[0]) => {
    setSelectedTemplate(template)
    setCustomMessage(template.message)
  }

  const handleSendMessage = async () => {
    if (!customMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        variant: 'destructive'
      })
      return
    }

    setSending(true)

    try {
      // Send message via staff API
      const response = await fetch('/api/staff/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          title: selectedTemplate?.title || 'Staff Message',
          message: customMessage,
          icon: 'message'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      toast({
        title: 'Message Sent!',
        description: 'Your message has been sent to all customers',
      })

      // Reset form
      setSelectedTemplate(null)
      setCustomMessage('')

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-penkey-cream">
      <header className="bg-white border-b border-penkey-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-penkey-orange" />
            <h1 className="text-2xl font-bold text-penkey-dark">Quick Messages</h1>
          </div>
          <Link href="/staff/dashboard">
            <Button variant="ghost" size="icon" className="text-penkey-gray hover:text-penkey-dark">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">

        {/* Message Templates */}
        <Card className="border-penkey-border bg-white">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="flex items-center gap-2 text-amber-950">
              <Sparkles className="w-6 h-6 text-amber-700" />
              Message Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {messageTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                    selectedTemplate?.id === template.id 
                      ? 'border-amber-400 bg-amber-50' 
                      : 'border-amber-200 hover:border-amber-300'
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardContent className={`p-4 bg-gradient-to-br ${template.color}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-amber-700">{template.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-amber-950 mb-1">{template.title}</h3>
                        <p className="text-xs md:text-sm text-amber-800 line-clamp-2">
                          {template.message}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Editor */}
        <Card className="border-penkey-border bg-white">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="flex items-center gap-2 text-amber-950">
              <MessageSquare className="w-6 h-6 text-amber-700" />
              Compose Message
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-4">
            
            {selectedTemplate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">Template:</span> {selectedTemplate.title}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-amber-900">
                Message Content
              </label>
              <Textarea
                placeholder="Type your message here or select a template above..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="text-base"
              />
              <p className="text-xs text-amber-600">
                {customMessage.length} characters
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2 text-sm">Preview:</h3>
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-sm text-gray-900">
                  {customMessage || 'Your message will appear here...'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSendMessage}
                disabled={sending || !customMessage.trim()}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                size="lg"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send to All Customers'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null)
                  setCustomMessage('')
                }}
                disabled={sending}
              >
                Clear
              </Button>
            </div>

            <p className="text-xs text-amber-600 text-center">
              This will send a notification to all active customers
            </p>

          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="border-penkey-border bg-white">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-900 mb-2 text-sm">Tips:</h3>
            <ul className="space-y-1 text-xs text-amber-800">
              <li>• Keep messages short and friendly</li>
              <li>• Use clear and engaging language</li>
              <li>• Mention specific offers or rewards</li>
              <li>• Send at appropriate times (not too early/late)</li>
            </ul>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
