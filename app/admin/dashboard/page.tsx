import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Gift, Gamepad2, TrendingUp } from 'lucide-react'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get total ducks collected
  const { count: totalDucks } = await supabase
    .from('coffee_stamps')
    .select('*', { count: 'exact', head: true })

  // Get total rewards redeemed
  const { count: redeemedRewards } = await supabase
    .from('user_rewards')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'redeemed')

  // Get games played today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { count: gamesToday } = await supabase
    .from('game_plays')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  // Get top 5 customers by duck count
  const { data: topCustomers } = await supabase
    .from('users')
    .select(`
      id,
      name,
      email,
      ducks (count)
    `)
    .order('ducks(count)', { ascending: false })
    .limit(5)

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select(`
      *,
      users (name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of Penkey Perks activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ducks Collected</CardTitle>
            <span className="text-2xl">🦆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDucks || 0}</div>
            <p className="text-xs text-muted-foreground">Total loyalty stamps</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rewards Redeemed</CardTitle>
            <Gift className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redeemedRewards || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Games Today</CardTitle>
            <Gamepad2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gamesToday || 0}</div>
            <p className="text-xs text-muted-foreground">Plays today</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Customers
          </CardTitle>
          <CardDescription>Customers with the most ducks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers?.map((customer: any, index: number) => (
              <div key={customer.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-penkey-orange font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
                <div className="text-lg font-bold text-penkey-orange">
                  {customer.ducks?.[0]?.count || 0} 🦆
                </div>
              </div>
            ))}
            {(!topCustomers || topCustomers.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No customers yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions?.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-grey-light rounded-lg">
                <div>
                  <p className="font-medium">
                    {transaction.users?.name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.action.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {(!recentTransactions || recentTransactions.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No activity yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
