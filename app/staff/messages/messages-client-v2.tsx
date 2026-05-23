'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Send, 
  Bell, 
  Mail, 
  MessageSquare, 
  Coffee,
  Loader2,
  CheckCircle
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
  description: string
}

export function MessagesClient({ staffId, staffName }: MessagesClientProps) {
  const [templates, setTemplates] = useState<PushTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PushTemplate | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  
  // Channel selection
  const [sendPush, setSendPush] = useState(true)
  const [sendEmail, setSendEmail] = useState(false)
  const [sendInApp, setSendInApp] = useState(true)
  
  const [sending, setSending] = useState(false)
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
          url: '/dashboard',
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

      const channels = []
      if (sendPush) channels.push(`${data.pushSent || 0} push`)
      if (sendEmail) channels.push(`${data.emailsQueued || 0} emails`)
      if (sendInApp) channels.push('in-app')

      toast({
        title: '✅ Message Sent!',
        description: `Delivered: ${channels.join(', ')}`
      })

      // Reset form
      setCustomTitle('')
      setCustomMessage('')
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
      {/* Header - matches staff dashboard */}
      <header className="bg-white border-b border-penkey-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-2">
            <Coffee className="w-8 h-8 text-penkey-orange" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-penkey-dark">Send Message</h1>
              <p className="text-xs text-penkey-gray hidden sm:block">Broadcast to customers</p>
            </div>
          </div>
          <Link href="/staff/dashboard">
            <Button variant="ghost" size="sm" className="text-penkey-gray">
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content - mobile-first, max-w-2xl like dashboard */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        
        {/* Greeting Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-penkey-orange">
          <CardContent className="p-4">
            <p className="text-sm text-penkey-dark">
              <span className="font-semibold">Hi {staffName}!</span> 👋
              <br />
              <span className="text-penkey-gray">Send messages to all customers via push, email, or in-app notifications.</span>
            </p>
          </CardContent>
        </Card>

        {/* Channel Selection */}
        <Card className="border-penkey-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-penkey-orange" />
              Delivery Channels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            
            {/* Push */}
            <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-penkey-border bg-white">
              <Checkbox
                id="push"
                checked={sendPush}
                onCheckedChange={setSendPush}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="push" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Bell className="w-4 h-4 text-penkey-orange" />
                  Push Notifications
                </Label>
                <p className="text-xs text-penkey-gray mt-1">
                  Instant alerts to subscribed users
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-penkey-border bg-white">
              <Checkbox
                id="email"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Mail className="w-4 h-4 text-penkey-orange" />
                  Email
                </Label>
                <p className="text-xs text-penkey-gray mt-1">
                  Send to all customer emails
                </p>
              </div>
            </div>

            {/* In-App */}
            <div className="flex items-start gap-3 p-3 rounded-lg border-2 border-penkey-border bg-white">
              <Checkbox
                id="inapp"
                checked={sendInApp}
                onCheckedChange={setSendInApp}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="inapp" className="flex items-center gap-2 cursor-pointer font-medium">
                  <MessageSquare className="w-4 h-4 text-penkey-orange" />
                  In-App Banner
                </Label>
                <p className="text-xs text-penkey-gray mt-1">
                  Show banner in dashboard
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Templates */}
        <Card className="border-penkey-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coffee className="w-5 h-5 text-penkey-orange" />
              Quick Templates
            </CardTitle>
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

        {/* Message Editor */}
        <Card className="border-penkey-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-penkey-orange" />
              Compose Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div>
              <Label htmlFor="title" className="text-penkey-dark font-medium">Title</Label>
              <Input
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter message title..."
                className="mt-1 border-penkey-border"
              />
            </div>

            <div>
              <Label htmlFor="message" className="text-penkey-dark font-medium">Message</Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={5}
                className="mt-1 border-penkey-border"
              />
              <p className="text-xs text-penkey-gray mt-1">
                {customMessage.length} characters
              </p>
            </div>

            {/* Preview */}
            {customTitle && customMessage && (
              <div className="p-4 bg-orange-50 rounded-lg border-2 border-penkey-orange/30">
                <p className="text-xs font-semibold text-penkey-gray mb-2">Preview:</p>
                <div className="bg-white p-3 rounded-lg border border-penkey-border">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-penkey-orange rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-penkey-dark">{customTitle}</p>
                      <p className="text-xs text-penkey-gray mt-1">{customMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={sending || !customTitle || !customMessage}
              className="w-full bg-penkey-orange hover:bg-penkey-orange/90 text-white h-12"
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

      </main>
    </div>
  )
}
