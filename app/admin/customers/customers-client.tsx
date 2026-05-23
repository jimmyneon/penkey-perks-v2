'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Search, Plus, Minus, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface CustomersClientProps {
  customers: any[]
}

export function CustomersClient({ customers: initialCustomers }: CustomersClientProps) {
  const [customers, setCustomers] = useState(initialCustomers)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [duckAmount, setDuckAmount] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddDucks = async () => {
    if (!selectedCustomer || duckAmount < 1) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ducks/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer.id,
          amount: duckAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add ducks')
      }

      toast({
        title: 'Success!',
        description: `Added ${duckAmount} duck${duckAmount > 1 ? 's' : ''} to ${selectedCustomer.name}`,
      })

      router.refresh()
      setSelectedCustomer(null)
      setDuckAmount(1)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDucks = async () => {
    if (!selectedCustomer || duckAmount < 1) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/ducks/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedCustomer.id,
          amount: duckAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove ducks')
      }

      toast({
        title: 'Success',
        description: `Removed ${duckAmount} duck${duckAmount > 1 ? 's' : ''} from ${selectedCustomer.name}`,
      })

      router.refresh()
      setSelectedCustomer(null)
      setDuckAmount(1)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Customer Management</h1>
        <p className="text-muted-foreground">Search and manage customer accounts</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
          <CardDescription>All registered customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 bg-grey-light rounded-lg hover:bg-grey-light/80 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-penkey-orange">
                      {customer.ducks?.[0]?.count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Ducks</p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              </div>
            ))}

            {filteredCustomers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No customers found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.name}</DialogTitle>
            <DialogDescription>{selectedCustomer?.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Ducks */}
            <div className="text-center p-6 bg-gradient-to-br from-penkey-orange to-penkey-orange-light rounded-lg">
              <p className="text-4xl font-bold text-white">
                {selectedCustomer?.ducks?.[0]?.count || 0} 🦆
              </p>
              <p className="text-white/80 text-sm mt-2">Total Ducks</p>
            </div>

            {/* Add/Remove Ducks */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="duckAmount">Number of Ducks</Label>
                <Input
                  id="duckAmount"
                  type="number"
                  min="1"
                  value={duckAmount}
                  onChange={(e) => setDuckAmount(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleAddDucks}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Ducks
                </Button>

                <Button
                  onClick={handleRemoveDucks}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium">
                  {selectedCustomer && new Date(selectedCustomer.created_at).toLocaleDateString()}
                </span>
              </div>
              {selectedCustomer?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{selectedCustomer.phone}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
