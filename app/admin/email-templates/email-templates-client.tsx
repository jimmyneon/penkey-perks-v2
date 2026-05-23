'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Edit, Trash2, Eye, Mail, Search } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface EmailTemplate {
  id: string
  name: string
  display_name: string
  description: string | null
  subject: string
  category: string
  active: boolean
  variables: string[]
  created_at: string
  updated_at: string
}

interface EmailTemplatesClientProps {
  templates: EmailTemplate[]
}

export function EmailTemplatesClient({ templates: initialTemplates }: EmailTemplatesClientProps) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete template')

      setTemplates(templates.filter(t => t.id !== id))

      toast({
        title: 'Success',
        description: 'Email template deleted successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete email template',
        variant: 'destructive',
      })
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transactional': return 'bg-blue-100 text-blue-800'
      case 'marketing': return 'bg-purple-100 text-purple-800'
      case 'notification': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const categories = ['all', 'transactional', 'marketing', 'notification']
  const categoryCounts = {
    all: templates.length,
    transactional: templates.filter(t => t.category === 'transactional').length,
    marketing: templates.filter(t => t.category === 'marketing').length,
    notification: templates.filter(t => t.category === 'notification').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-penkey-orange" />
              <h1 className="text-xl font-bold text-gray-900">Email Templates</h1>
            </div>
          </div>
          <Link href="/admin/email-templates/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{templates.length}</div>
              <div className="text-sm text-gray-600">Total Templates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {templates.filter(t => t.active).length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">
                {categoryCounts.transactional}
              </div>
              <div className="text-sm text-gray-600">Transactional</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {categoryCounts.marketing}
              </div>
              <div className="text-sm text-gray-600">Marketing</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={categoryFilter === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCategoryFilter(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                    <span className="ml-2 text-xs">
                      ({categoryCounts[category as keyof typeof categoryCounts]})
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <div className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first email template'}
                </p>
                {!searchQuery && categoryFilter === 'all' && (
                  <Link href="/admin/email-templates/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Template
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className={!template.active ? 'opacity-60' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Content */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">
                          {template.display_name}
                        </h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {!template.active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                        {template.description && (
                          <p className="text-sm text-gray-600">
                            <strong>Description:</strong> {template.description}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          <strong>Template ID:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">{template.name}</code>
                        </p>
                      </div>

                      {template.variables && template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-gray-600">Variables:</span>
                          {template.variables.map((variable: string) => (
                            <code key={variable} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {`{{${variable}}}`}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/email-templates/preview/${template.id}`}>
                        <Button variant="outline" size="icon" title="Preview">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/email-templates/edit/${template.id}`}>
                        <Button variant="outline" size="icon" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Delete"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(template.id, template.display_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <h3 className="font-bold text-blue-900 mb-2">💡 How It Works</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Email templates are stored in the database and can be edited without code changes</li>
              <li>Use variables like {`{{name}}`} or {`{{rewardName}}`} for dynamic content</li>
              <li>Transactional emails are always sent (cannot be unsubscribed)</li>
              <li>Marketing emails respect user preferences</li>
              <li>Templates are rendered when emails are queued for sending</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
