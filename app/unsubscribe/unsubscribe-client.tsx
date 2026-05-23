'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface UnsubscribeClientProps {
  token: string
  preferences: any
}

export function UnsubscribeClient({ token, preferences }: UnsubscribeClientProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [prefs, setPrefs] = useState({
    achievement_emails: preferences?.achievement_emails ?? true,
    reminder_emails: preferences?.reminder_emails ?? true,
    digest_emails: preferences?.digest_emails ?? true,
    marketing_emails: preferences?.marketing_emails ?? true,
    reengagement_emails: preferences?.reengagement_emails ?? true,
  })

  const handleUnsubscribeAll = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, unsubscribeAll: true }),
      })

      if (response.ok) {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Unsubscribe error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, preferences: prefs }),
      })

      if (response.ok) {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Update preferences error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-penkey-cream flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <CardTitle className="text-2xl">Preferences Updated!</CardTitle>
            <CardDescription>
              Your email preferences have been saved successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a
              href="/"
              className="inline-block bg-penkey-orange text-white px-6 py-3 rounded-lg font-semibold hover:bg-penkey-orange-dark transition"
            >
              Go to Home
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-penkey-cream flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Email Preferences</CardTitle>
          <CardDescription>
            Choose which emails you'd like to receive from Penkey Perks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Categories */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-penkey-cream rounded-lg">
              <Checkbox
                id="achievement"
                checked={prefs.achievement_emails}
                onCheckedChange={(checked) =>
                  setPrefs({ ...prefs, achievement_emails: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="achievement" className="font-semibold text-penkey-dark cursor-pointer">
                  🏅 Achievement Emails
                </Label>
                <p className="text-sm text-penkey-gray mt-1">
                  Badges earned, milestones reached, streaks, and big wins
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-penkey-cream rounded-lg">
              <Checkbox
                id="reminder"
                checked={prefs.reminder_emails}
                onCheckedChange={(checked) =>
                  setPrefs({ ...prefs, reminder_emails: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="reminder" className="font-semibold text-penkey-dark cursor-pointer">
                  ⏰ Reminder Emails
                </Label>
                <p className="text-sm text-penkey-gray mt-1">
                  Expiring rewards, game reminders, and important notifications
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-penkey-cream rounded-lg">
              <Checkbox
                id="digest"
                checked={prefs.digest_emails}
                onCheckedChange={(checked) =>
                  setPrefs({ ...prefs, digest_emails: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="digest" className="font-semibold text-penkey-dark cursor-pointer">
                  📊 Summary Emails
                </Label>
                <p className="text-sm text-penkey-gray mt-1">
                  Weekly summaries, monthly reports, and activity digests
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-penkey-cream rounded-lg">
              <Checkbox
                id="marketing"
                checked={prefs.marketing_emails}
                onCheckedChange={(checked) =>
                  setPrefs({ ...prefs, marketing_emails: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="marketing" className="font-semibold text-penkey-dark cursor-pointer">
                  🌟 Marketing Emails
                </Label>
                <p className="text-sm text-penkey-gray mt-1">
                  Weekend specials, new rewards, and promotional offers
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-penkey-cream rounded-lg">
              <Checkbox
                id="reengagement"
                checked={prefs.reengagement_emails}
                onCheckedChange={(checked) =>
                  setPrefs({ ...prefs, reengagement_emails: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="reengagement" className="font-semibold text-penkey-dark cursor-pointer">
                  💌 We Miss You Emails
                </Label>
                <p className="text-sm text-penkey-gray mt-1">
                  Win-back campaigns and special comeback offers
                </p>
              </div>
            </div>
          </div>

          {/* Note about transactional emails */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You'll still receive important transactional emails like reward confirmations and account updates.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleUpdatePreferences}
              disabled={loading}
              className="flex-1 bg-penkey-orange hover:bg-penkey-orange-dark"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
            <Button
              onClick={handleUnsubscribeAll}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Processing...' : 'Unsubscribe from All'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
