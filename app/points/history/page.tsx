import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function PointsHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get points transactions
  const { data: transactions } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get current balance
  const { data: currentBalance } = await supabase
    .rpc('get_user_points', { p_user_id: user.id })

  return (
    <div className="min-h-screen bg-penkey-cream">
      {/* Header */}
      <header className="bg-white border-b border-penkey-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4 max-w-2xl">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-penkey-dark">Points History</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Current Balance */}
        <Card className="border-penkey-orange bg-gradient-to-br from-white to-penkey-orange/5">
          <CardHeader>
            <CardTitle className="text-center text-penkey-dark">Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-center text-penkey-orange">
              {currentBalance || 0}
            </p>
            <p className="text-center text-penkey-gray mt-2">points</p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-penkey-dark">Transaction History</CardTitle>
            <CardDescription className="text-penkey-gray">
              Your last 50 transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-penkey-cream rounded-lg border border-penkey-border"
                  >
                    <div className="flex items-center gap-3">
                      {transaction.amount > 0 ? (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-penkey-dark">
                          {transaction.description || transaction.source}
                        </p>
                        <p className="text-sm text-penkey-gray">
                          {new Date(transaction.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </p>
                      <p className="text-xs text-penkey-gray capitalize">
                        {transaction.source}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-penkey-gray">No transactions yet</p>
                <p className="text-sm text-penkey-gray mt-2">
                  Check in or play games to earn points!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
