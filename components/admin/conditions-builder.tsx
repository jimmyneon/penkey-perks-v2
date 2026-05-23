'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

interface Rule {
  field: string
  operator: string
  value: string
}

interface ConditionsBuilderProps {
  conditions: Record<string, any>
  onChange: (conditions: Record<string, any>) => void
}

export function ConditionsBuilder({ conditions, onChange }: ConditionsBuilderProps) {
  // Convert conditions object to rules array
  const conditionsToRules = (cond: Record<string, any>): Rule[] => {
    const rules: Rule[] = []
    for (const [field, value] of Object.entries(cond)) {
      if (typeof value === 'boolean') {
        rules.push({ field, operator: 'equals', value: String(value) })
      } else if (typeof value === 'object' && value !== null) {
        if ('min' in value) {
          rules.push({ field, operator: 'min', value: String(value.min) })
        }
        if ('max' in value) {
          rules.push({ field, operator: 'max', value: String(value.max) })
        }
        if ('equals' in value) {
          rules.push({ field, operator: 'equals', value: String(value.equals) })
        }
      } else {
        rules.push({ field, operator: 'equals', value: String(value) })
      }
    }
    return rules
  }

  // Convert rules array to conditions object
  const rulesToConditions = (rules: Rule[]): Record<string, any> => {
    const cond: Record<string, any> = {}
    
    for (const rule of rules) {
      const { field, operator, value } = rule
      
      if (operator === 'equals') {
        // Boolean check
        if (value === 'true' || value === 'false') {
          cond[field] = value === 'true'
        } else if (!isNaN(Number(value))) {
          cond[field] = { equals: Number(value) }
        } else {
          cond[field] = value
        }
      } else if (operator === 'min' || operator === 'max') {
        if (!cond[field]) cond[field] = {}
        cond[field][operator] = Number(value)
      }
    }
    
    return cond
  }

  const [rules, setRules] = useState<Rule[]>(conditionsToRules(conditions))

  const addRule = () => {
    const newRules = [...rules, { field: '', operator: 'equals', value: '' }]
    setRules(newRules)
  }

  const removeRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index)
    setRules(newRules)
    onChange(rulesToConditions(newRules))
  }

  const updateRule = (index: number, updates: Partial<Rule>) => {
    const newRules = rules.map((rule, i) => 
      i === index ? { ...rule, ...updates } : rule
    )
    setRules(newRules)
    onChange(rulesToConditions(newRules))
  }

  const fieldOptions = [
    { value: 'hasUnredeemedRewards', label: 'Has Unredeemed Rewards', type: 'boolean' },
    { value: 'currentStreak', label: 'Current Streak', type: 'number' },
    { value: 'hasCheckedInToday', label: 'Checked In Today', type: 'boolean' },
    { value: 'hasCoffeeStampToday', label: 'Got Coffee Stamp Today', type: 'boolean' },
    { value: 'hasPlayedGameToday', label: 'Played Game Today', type: 'boolean' },
    { value: 'stampsUntilReward', label: 'Stamps Until Reward', type: 'number' },
    { value: 'hoursUntilExpiry', label: 'Hours Until Expiry', type: 'number' },
    { value: 'daysUntilExpiry', label: 'Days Until Expiry', type: 'number' },
    { value: 'currentPoints', label: 'Current Points', type: 'number' },
    { value: 'lifetimePoints', label: 'Lifetime Points', type: 'number' },
  ]

  return (
    <div className="space-y-4">
      {rules.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No conditions set. This notification will always be eligible to show.
        </p>
      )}

      {rules.map((rule, index) => {
        const selectedField = fieldOptions.find(f => f.value === rule.field)
        const isBoolean = selectedField?.type === 'boolean'
        const isNumber = selectedField?.type === 'number'

        return (
          <div key={index} className="flex gap-2 items-end">
            {/* Field */}
            <div className="flex-1 space-y-2">
              {index === 0 && <Label>Field</Label>}
              <Select value={rule.field} onValueChange={(value) => updateRule(index, { field: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operator */}
            <div className="flex-1 space-y-2">
              {index === 0 && <Label>Operator</Label>}
              <Select 
                value={rule.operator} 
                onValueChange={(value) => updateRule(index, { operator: value })}
                disabled={isBoolean}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  {isNumber && (
                    <>
                      <SelectItem value="min">Greater Than or Equal</SelectItem>
                      <SelectItem value="max">Less Than or Equal</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Value */}
            <div className="flex-1 space-y-2">
              {index === 0 && <Label>Value</Label>}
              {isBoolean ? (
                <Select value={rule.value} onValueChange={(value) => updateRule(index, { value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={isNumber ? 'number' : 'text'}
                  value={rule.value}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  placeholder="Value"
                />
              )}
            </div>

            {/* Remove */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRule(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )
      })}

      <Button type="button" variant="outline" onClick={addRule} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Condition
      </Button>

      {rules.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-900 mb-1">Conditions Preview:</p>
          <pre className="text-xs text-blue-800 overflow-x-auto">
            {JSON.stringify(rulesToConditions(rules), null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
