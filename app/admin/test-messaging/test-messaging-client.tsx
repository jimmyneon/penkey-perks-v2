'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Mail, Bell, MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface TestMessagingClientProps {
  userEmail: string
  userId: string
}

interface TestResult {
  type: string
  status: 'success' | 'error' | 'pending'
  message: string
  details?: any
}

export function TestMessagingClient({ userEmail, userId }: TestMessagingClientProps) {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Push notification test state
  const [pushTitle, setPushTitle] = useState('🎉 Test Push Notification')
  const [pushMessage, setPushMessage] = useState('This is a test push notification from Penkey Perks!')
  const [pushUrl, setPushUrl] = useState('/dashboard')

  // Email test state
  const [emailTo, setEmailTo] = useState(userEmail)
  const [emailSubject, setEmailSubject] = useState('Test Email from Penkey Perks')
  const [emailTemplate, setEmailTemplate] = useState('welcome_email')

  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev])
  }

  // Test 1: Check Database Tables
  const testDatabaseTables = async () => {
    setIsLoading(true)
    addResult({ type: 'Database Tables', status: 'pending', message: 'Checking database tables...' })

    try {
      const response = await fetch('/api/admin/test-messaging/check-tables', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        addResult({
          type: 'Database Tables',
          status: 'success',
          message: `All tables exist! Notifications: ${data.notifications}, Email Templates: ${data.emailTemplates}, Push Subscriptions: ${data.pushSubscriptions}`,
          details: data
        })
        toast({ title: '✅ Database Check Passed', description: 'All tables exist and have data' })
      } else {
        throw new Error(data.error || 'Failed to check tables')
      }
    } catch (error: any) {
      addResult({
        type: 'Database Tables',
        status: 'error',
        message: error.message,
      })
      toast({ title: '❌ Database Check Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Test 2: Send Test Push Notification
  const testPushNotification = async () => {
    setIsLoading(true)
    addResult({ type: 'Push Notification', status: 'pending', message: 'Sending push notification...' })

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pushTitle,
          message: pushMessage,
          url: pushUrl,
        })
      })

      const data = await response.json()

      if (response.ok) {
        const sentCount = data.totalSent || 0
        addResult({
          type: 'Push Notification',
          status: 'success',
          message: `Push sent to ${sentCount} device(s)! (${data.totalFailed || 0} failed, ${data.totalExpired || 0} expired)`,
          details: data
        })
        toast({ title: '🔔 Push Sent!', description: `Delivered to ${sentCount} device(s)` })
      } else {
        throw new Error(data.error || 'Failed to send push')
      }
    } catch (error: any) {
      addResult({
        type: 'Push Notification',
        status: 'error',
        message: error.message,
      })
      toast({ title: '❌ Push Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Test 3: Send Test Email
  const testEmail = async () => {
    setIsLoading(true)
    addResult({ type: 'Email', status: 'pending', message: 'Sending test email...' })

    try {
      const response = await fetch('/api/admin/test-messaging/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          template: emailTemplate,
          variables: {
            name: 'Test User',
            referralUrl: 'https://perks.penkey.co.uk/signup?ref=TEST123',
            appUrl: 'https://perks.penkey.co.uk',
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        addResult({
          type: 'Email',
          status: 'success',
          message: `Email queued successfully! Check ${emailTo}`,
          details: data
        })
        toast({ title: '📧 Email Queued!', description: `Check your inbox at ${emailTo}` })
      } else {
        throw new Error(data.error || 'Failed to send email')
      }
    } catch (error: any) {
      addResult({
        type: 'Email',
        status: 'error',
        message: error.message,
      })
      toast({ title: '❌ Email Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Test 4: Check In-App Notifications
  const testInAppNotifications = async () => {
    setIsLoading(true)
    addResult({ type: 'In-App Notifications', status: 'pending', message: 'Fetching notifications...' })

    try {
      const response = await fetch('/api/notifications/get-for-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          userState: {
            currentStreak: 5,
            hasCheckedInToday: false,
            currentPoints: 100,
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        addResult({
          type: 'In-App Notifications',
          status: 'success',
          message: `Found ${data.notifications?.length || 0} matching notifications`,
          details: data
        })
        toast({ title: '✅ Notifications Working', description: `${data.notifications?.length || 0} notifications matched` })
      } else {
        throw new Error(data.error || 'Failed to fetch notifications')
      }
    } catch (error: any) {
      addResult({
        type: 'In-App Notifications',
        status: 'error',
        message: error.message,
      })
      toast({ title: '❌ Notifications Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Test 5: Check Push Subscription
  const testPushSubscription = async () => {
    setIsLoading(true)
    addResult({ type: 'Push Subscription', status: 'pending', message: 'Checking push subscriptions...' })

    try {
      const response = await fetch('/api/admin/test-messaging/check-subscriptions', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        addResult({
          type: 'Push Subscription',
          status: 'success',
          message: `Found ${data.activeSubscriptions} active subscription(s)`,
          details: data
        })
        toast({ title: '✅ Subscriptions Found', description: `${data.activeSubscriptions} active device(s)` })
      } else {
        throw new Error(data.error || 'Failed to check subscriptions')
      }
    } catch (error: any) {
      addResult({
        type: 'Push Subscription',
        status: 'error',
        message: error.message,
      })
      toast({ title: '❌ Subscription Check Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setResults([])
    await testDatabaseTables()
    await new Promise(resolve => setTimeout(resolve, 500))
    await testInAppNotifications()
    await new Promise(resolve => setTimeout(resolve, 500))
    await testPushSubscription()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-penkey-dark">🧪 Messaging System Test Suite</h1>
              <p className="text-sm text-penkey-gray">Test push notifications, emails, and in-app messages</p>
            </div>
          </div>
          <Button onClick={runAllTests} disabled={isLoading} className="bg-penkey-orange hover:bg-penkey-orange/90">
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Run All Tests
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Test Controls */}
          <div className="space-y-6">
            {/* Database Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-penkey-orange" />
                  1. Database Tables
                </CardTitle>
                <CardDescription>Verify all messaging tables exist and have data</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testDatabaseTables} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Check Database
                </Button>
              </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-penkey-orange" />
                  2. In-App Notifications
                </CardTitle>
                <CardDescription>Test notification matching and display</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testInAppNotifications} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Test Notifications
                </Button>
              </CardContent>
            </Card>

            {/* Push Subscription Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-penkey-orange" />
                  3. Push Subscriptions
                </CardTitle>
                <CardDescription>Check active push notification subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={testPushSubscription} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Check Subscriptions
                </Button>
              </CardContent>
            </Card>

            {/* Push Notification Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-penkey-orange" />
                  4. Send Push Notification
                </CardTitle>
                <CardDescription>Send a test push to all subscribed devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="push-title">Title</Label>
                  <Input
                    id="push-title"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <Label htmlFor="push-message">Message</Label>
                  <Textarea
                    id="push-message"
                    value={pushMessage}
                    onChange={(e) => setPushMessage(e.target.value)}
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="push-url">URL (optional)</Label>
                  <Input
                    id="push-url"
                    value={pushUrl}
                    onChange={(e) => setPushUrl(e.target.value)}
                    placeholder="/dashboard"
                  />
                </div>
                <Button onClick={testPushNotification} disabled={isLoading} className="w-full bg-penkey-orange hover:bg-penkey-orange/90">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Push
                </Button>
              </CardContent>
            </Card>

            {/* Email Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-penkey-orange" />
                  5. Send Test Email
                </CardTitle>
                <CardDescription>Send a test email using a template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email-to">To Email</Label>
                  <Input
                    id="email-to"
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="recipient@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email-template">Template</Label>
                  <select
                    id="email-template"
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="welcome_email">Welcome Email</option>
                    <option value="reward_earned">Reward Earned</option>
                    <option value="reward_expiring">Reward Expiring</option>
                    <option value="referral_confirmed">Referral Confirmed</option>
                    <option value="birthday_email">Birthday Email</option>
                    <option value="win_back_email">Win Back Email</option>
                    <option value="milestone_email">Milestone Email</option>
                  </select>
                </div>
                <Button onClick={testEmail} disabled={isLoading} className="w-full bg-penkey-orange hover:bg-penkey-orange/90">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Send Email
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Test Results */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  {results.length === 0 ? 'No tests run yet' : `${results.length} test(s) completed`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Run tests to see results here</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {result.type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date().toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {result.message}
                            </p>
                            {result.details && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                                  View details
                                </summary>
                                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                                  {JSON.stringify(result.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
