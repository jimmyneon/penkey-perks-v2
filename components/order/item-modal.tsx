'use client'

import { useState, useEffect } from 'react'
import { MenuItem } from '@/app/order/page'
import { X, Plus, Minus, Check } from 'lucide-react'

interface ItemModalProps {
  item: MenuItem
  onClose: () => void
  onAdd: (item: MenuItem, quantity: number, selectedModifiers: any[]) => void
}

interface SelectedModifier {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_adjustment: number
}

export function ItemModal({ item, onClose, onAdd }: ItemModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([])
  const [selectedVariant, setSelectedVariant] = useState(
    item.item_variants?.find((v: any) => v.is_default) || item.item_variants?.[0] || null
  )

  // Initialize default modifiers
  useEffect(() => {
    if (item.modifier_groups) {
      const defaults: SelectedModifier[] = []
      item.modifier_groups.forEach((group: any) => {
        group.modifier_options
          .filter((opt: any) => opt.is_default)
          .forEach((opt: any) => {
            defaults.push({
              group_id: group.id,
              group_name: group.name,
              option_id: opt.id,
              option_name: opt.name,
              price_adjustment: opt.price_adjustment
            })
          })
      })
      setSelectedModifiers(defaults)
    }
  }, [item])

  const toggleModifier = (groupId: string, groupName: string, optionId: string, optionName: string, priceAdjustment: number, selectionType: string, maxSelections: number | null) => {
    const isSelected = selectedModifiers.some(m => m.option_id === optionId)
    
    if (isSelected) {
      setSelectedModifiers(prev => prev.filter(m => m.option_id !== optionId))
    } else {
      // Check max selections
      const groupSelections = selectedModifiers.filter(m => m.group_id === groupId).length
      if (maxSelections && groupSelections >= maxSelections) {
        // Remove the first selection (FIFO)
        setSelectedModifiers(prev => {
          const groupMods = prev.filter(m => m.group_id === groupId)
          const otherMods = prev.filter(m => m.group_id !== groupId)
          return [...otherMods, ...groupMods.slice(1), {
            group_id: groupId,
            group_name: groupName,
            option_id: optionId,
            option_name: optionName,
            price_adjustment: priceAdjustment
          }]
        })
      } else {
        // For single selection, clear other options in the group
        if (selectionType === 'required' && maxSelections === 1) {
          setSelectedModifiers(prev => [
            ...prev.filter(m => m.group_id !== groupId),
            {
              group_id: groupId,
              group_name: groupName,
              option_id: optionId,
              option_name: optionName,
              price_adjustment: priceAdjustment
            }
          ])
        } else {
          setSelectedModifiers(prev => [...prev, {
            group_id: groupId,
            group_name: groupName,
            option_id: optionId,
            option_name: optionName,
            price_adjustment: priceAdjustment
          }])
        }
      }
    }
  }

  const calculateTotal = () => {
    let total = (selectedVariant?.price || item.base_price) * quantity
    selectedModifiers.forEach(mod => {
      total += mod.price_adjustment * quantity
    })
    return total
  }

  const canAdd = () => {
    if (!item.modifier_groups) return true
    
    // Check required groups
    for (const group of item.modifier_groups) {
      if (group.selection_type === 'required') {
        const selectedCount = selectedModifiers.filter(m => m.group_id === group.id).length
        if (selectedCount < group.min_selections) {
          return false
        }
      }
    }
    return true
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div 
        className="relative bg-white rounded-t-[24px] sm:rounded-[24px] w-full max-w-[400px] max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: '#F9F7F2' }}
      >
        {/* Header */}
        <div className="sticky top-0 px-5 pt-4 pb-3 flex items-center justify-between" style={{ backgroundColor: '#F9F7F2' }}>
          <h2 className="text-[20px] font-bold" style={{ color: '#24364B' }}>{item.name}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8E2D8' }}>
            <X className="w-4 h-4" style={{ color: '#24364B' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-6 space-y-4">
          {item.description && (
            <p className="text-[14px] leading-relaxed" style={{ color: '#8A96A0' }}>
              {item.description}
            </p>
          )}

          {/* Variants */}
          {item.item_variants && item.item_variants.length > 0 && (
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#A89080' }}>
                Size
              </p>
              <div className="space-y-2">
                {item.item_variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className="w-full px-4 py-3 rounded-[12px] text-left flex items-center justify-between"
                    style={{ 
                      backgroundColor: selectedVariant?.id === variant.id ? '#24364B' : '#F4EFE7',
                      border: '1px solid #E8E2D8'
                    }}
                  >
                    <span className="text-[14px] font-semibold" style={{ color: selectedVariant?.id === variant.id ? '#F9F7F2' : '#24364B' }}>
                      {variant.name}
                    </span>
                    <span className="text-[14px] font-bold" style={{ color: selectedVariant?.id === variant.id ? '#F9F7F2' : '#F28A2E' }}>
                      £{variant.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {item.modifier_groups && item.modifier_groups.map((group: any) => {
            const selectedInGroup = selectedModifiers.filter(m => m.group_id === group.id)
            const isRequired = group.selection_type === 'required'
            const isValid = selectedInGroup.length >= group.min_selections
            
            return (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: '#A89080' }}>
                    {group.name}
                  </p>
                  {isRequired && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFE5E5', color: '#DC2626' }}>
                      Required
                    </span>
                  )}
                  {!isValid && isRequired && (
                    <span className="text-[10px] font-semibold" style={{ color: '#DC2626' }}>
                      (min {group.min_selections})
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {group.modifier_options.map((option: any) => {
                    const isSelected = selectedModifiers.some(m => m.option_id === option.id)
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleModifier(
                          group.id, 
                          group.name, 
                          option.id, 
                          option.name, 
                          option.price_adjustment,
                          group.selection_type,
                          group.max_selections
                        )}
                        className="w-full px-4 py-3 rounded-[12px] text-left flex items-center justify-between"
                        style={{ 
                          backgroundColor: isSelected ? '#24364B' : '#F4EFE7',
                          border: '1px solid #E8E2D8',
                          opacity: !isSelected && group.max_selections && selectedInGroup.length >= group.max_selections ? 0.5 : 1
                        }}
                        disabled={!isSelected && group.max_selections && selectedInGroup.length >= group.max_selections}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isSelected ? 'bg-white' : 'bg-transparent'}`} style={{ border: '2px solid #24364B' }}>
                            {isSelected && <Check className="w-3 h-3" style={{ color: '#24364B' }} />}
                          </div>
                          <span className="text-[14px] font-semibold" style={{ color: isSelected ? '#F9F7F2' : '#24364B' }}>
                            {option.name}
                          </span>
                        </div>
                        {option.price_adjustment > 0 && (
                          <span className="text-[14px] font-bold" style={{ color: isSelected ? '#F9F7F2' : '#F28A2E' }}>
                            +£{option.price_adjustment.toFixed(2)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Quantity */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] mb-2" style={{ color: '#A89080' }}>
              Quantity
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}
              >
                <Minus className="w-4 h-4" style={{ color: '#24364B' }} />
              </button>
              <span className="text-[20px] font-bold w-12 text-center" style={{ color: '#24364B' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#F4EFE7', border: '1px solid #E8E2D8' }}
              >
                <Plus className="w-4 h-4" style={{ color: '#24364B' }} />
              </button>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #E8E2D8' }}>
            <span className="text-[14px]" style={{ color: '#8A96A0' }}>Total</span>
            <span className="text-[24px] font-bold" style={{ color: '#F28A2E' }}>
              £{calculateTotal().toFixed(2)}
            </span>
          </div>

          {/* Add button */}
          <button
            onClick={() => onAdd(item, quantity, selectedModifiers)}
            disabled={!canAdd()}
            className="w-full py-4 rounded-[16px] text-white font-bold text-[15px] active:scale-[0.98] transition-all disabled:opacity-40"
            style={{ backgroundColor: '#24364B' }}
          >
            Add to order
          </button>
        </div>
      </div>
    </div>
  )
}
