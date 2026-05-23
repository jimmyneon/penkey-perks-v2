'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Send, 
  Bell, 
  Mail, 
  MessageSquare, 
  Sparkles,
  Coffee,
  Loader2,
  CheckCircle,
  Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MessagesClientProps {
  staffId: string
  staffName: string
}

interface PushTemplate {
  id: string
  name: string
  title: string
  message: string
  category: string
  url: string
  priority: number
  description: string
}

export function MessagesClient({ staffId, staffName }: MessagesClientProps) {
  const [templates, setTemplates] = useState<PushTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PushTemplate | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [customUrl, setCustomUrl] = useState('/dashboard')
  
  // Channel selection
  const [sendPush, setSendPush] = useState(true)
  const [sendEmail, setSendEmail] = useState(false)
  const [sendInApp, setSendInApp] = useState(true)
  
  const [sending, setSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/staff/push-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleSelectTemplate = (template: PushTemplate) => {
    setSelectedTemplate(template)
    setCustomTitle(template.title)
    setCustomMessage(template.message)
    setCustomUrl(template.url || '/dashboard')
  }

  const handleSendMessage = async () => {
    if (!customTitle.trim() || !customMessage.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both title and message',
        variant: 'destructive'
      })
      return
    }

    if (!sendPush && !sendEmail && !sendInApp) {
      toast({
        title: 'Error',
        description: 'Please select at least one channel',
        variant: 'destructive'
      })
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/staff/send-multi-channel-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          message: customMessage,
          url: customUrl,
          channels: {
            push: sendPush,
            email: sendEmail,
            inApp: sendInApp
          },
          templateName: selectedTemplate?.name || 'custom'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      toast({
        title: '✅ Message Sent!',
        description: `Sent via ${[
          sendPush && `Push (${data.pushSent || 0} devices)`,
          sendEmail && `Email (${data.emailsQueued || 0} queued)`,
          sendInApp && 'In-app'
        ].filter(Boolean).join(', ')}`
      })

      // Reset form
      setCustomTitle('')
      setCustomMessage('')
      setCustomUrl('/dashboard')
      setSelectedTemplate(null)

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const manualTemplates = templates.filter(t => t.category === 'manual')

  return (
    <div className="min-h-screen bg-penkey-cream">
      {/* Header */}
      <header className="bg-white border-b border-penkey-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/staff/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-penkey-dark">Send Message</h1>
                <p className="text-sm text-penkey-gray">Broadcast to all customers</p>
              </div>
            </div>
            <Badge variant="outline" className="text-penkey-orange border-penkey-orange">
              {staffName}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Templates */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-penkey-orange" />
                  Templates
                </CardTitle>
                <CardDescription>Quick message templates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {manualTemplates.length === 0 ? (
                  <p className="text-sm text-penkey-gray text-center py-4">
                    Loading templates...
                  </p>
                ) : (
                  manualTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate?.id === template.id
                          ? 'border-penkey-orange bg-orange-50'
                          : 'border-penkey-border hover:border-penkey-orange/50 bg-white'
                      }`}
                    >
                      <div className="font-semibold text-sm text-penkey-dark">
                        {template.title}
                      </div>
                      <div className="text-xs text-penkey-gray mt-1">
                        {template.description}
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Message Editor */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Channel Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Channels</CardTitle>
                <CardDescription>Choose how to send your message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Push Notifications */}
                  <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    sendPush ? 'border-penkey-orange bg-orange-50' : 'border-penkey-border bg-white'
                  }`} onClick={() => setSendPush(!sendPush)}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={sendPush}
                        onCheckedChange={setSendPush}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-penkey-orange" />
                          <Label className="font-semibold cursor-pointer">Push Notifications</Label>
                        </div>
                        <p className="text-xs text-penkey-gray mt-1">
                          Instant alerts to subscribed users
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    sendEmail ? 'border-penkey-orange bg-orange-50' : 'border-penkey-border bg-white'
                  }`} onClick={() => setSendEmail(!sendEmail)}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={sendEmail}
                        onCheckedChange={setSendEmail}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-penkey-orange" />
                          <Label className="font-semibold cursor-pointer">Email</Label>
                        </div>
                        <p className="text-xs text-penkey-gray mt-1">
                          Send to all customer emails
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* In-App */}
                  <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    sendInApp ? 'border-penkey-orange bg-orange-50' : 'border-penkey-border bg-white'
                  }`} onClick={() => setSendInApp(!sendInApp)}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={sendInApp}
                        onCheckedChange={setSendInApp}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-penkey-orange" />
                          <Label className="font-semibold cursor-pointer">In-App</Label>
                        </div>
                        <p className="text-xs text-penkey-gray mt-1">
                          Show banner in dashboard
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Message Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>Customize your message content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter message title..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter your message..."
                    rows={5}
                    className="mt-1"
                  />
                  <p className="text-xs text-penkey-gray mt-1">
                    {customMessage.length} characters
                  </p>
                </div>

                {sendPush && (
                  <div>
                    <Label htmlFor="url">Link URL (Push only)</Label>
                    <Input
                      id="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="/dashboard"
                      className="mt-1"
                    />
                    <p className="text-xs text-penkey-gray mt-1">
                      Where users go when they click the notification
                    </p>
                  </div>
                )}

                {/* Preview Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>

                {/* Preview */}
                {showPreview && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {sendPush && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">Push Notification Preview:</p>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-penkey-orange rounded-lg flex items-center justify-center flex-shrink-0">
                              <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900">{customTitle || 'Title'}</p>
                              <p className="text-xs text-gray-600 mt-1">{customMessage || 'Message'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {sendInApp && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">In-App Banner Preview:</p>
                        <div className="bg-orange-50 border-l-4 border-penkey-orange p-3 rounded">
                          <p className="font-semibold text-sm text-penkey-dark">{customTitle || 'Title'}</p>
                          <p className="text-xs text-penkey-gray mt-1">{customMessage || 'Message'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={sending || !customTitle || !customMessage}
                  className="w-full bg-penkey-orange hover:bg-penkey-orange/90 text-white"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send to All Customers
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>

          </div>

        </div>
      </main>
    </div>
  )
}
