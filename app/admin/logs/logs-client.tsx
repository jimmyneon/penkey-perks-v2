'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Search, Download, Calendar } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface LogsClientProps {
  transactions: any[]
}

export function LogsClient({ transactions: initialTransactions }: LogsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredTransactions = initialTransactions.filter(tx => {
    // Search filter
    const matchesSearch = !searchQuery || 
      tx.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.action.toLowerCase().includes(searchQuery.toLowerCase())

    // Date range filter
    const txDate = new Date(tx.created_at)
    const matchesStartDate = !startDate || txDate >= new Date(startDate)
    const matchesEndDate = !endDate || txDate <= new Date(endDate + 'T23:59:59')

    return matchesSearch && matchesStartDate && matchesEndDate
  })

  const exportToCSV = () => {
    const headers = ['Date', 'Action', 'User', 'Email', 'Staff', 'Details']
    const rows = filteredTransactions.map(tx => [
      formatDateTime(tx.created_at),
      tx.action,
      tx.users?.name || '',
      tx.users?.email || '',
      tx.staff?.name || '',
      JSON.stringify(tx.details || {})
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'check_in': return '✅'
      case 'game_play': return '🎮'
      case 'reward_earned': return '🎁'
      case 'reward_redeemed': return '✓'
      case 'referral_confirmed': return '👥'
      case 'manual_duck_add': return '➕'
      case 'manual_duck_remove': return '➖'
      default: return '📝'
    }
  }

  const getActionLabel = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction Logs</h1>
        <p className="text-muted-foreground">View all system activity and transactions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Filters
              </CardTitle>
              <CardDescription>Search and filter transactions</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search"
                placeholder="Search by user or action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || startDate || endDate) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStartDate('')
                setEndDate('')
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          <CardDescription>
            {startDate || endDate 
              ? `Filtered results` 
              : 'Last 100 transactions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-grey-light rounded-lg hover:bg-grey-light/80 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-2xl">{getActionIcon(tx.action)}</div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getActionLabel(tx.action)}</p>
                      {tx.staff && (
                        <span className="text-xs bg-penkey-orange text-white px-2 py-0.5 rounded">
                          Staff Action
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tx.users?.name} ({tx.users?.email})
                    </p>
                    {tx.staff && (
                      <p className="text-xs text-muted-foreground">
                        By: {tx.staff.name}
                      </p>
                    )}
                    {tx.details && Object.keys(tx.details).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {JSON.stringify(tx.details)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  {formatDateTime(tx.created_at)}
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No transactions found
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
