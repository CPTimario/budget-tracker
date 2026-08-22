import { Plane, Utensils, Building, Compass, ShoppingBag, Heart, Gift, MoreHorizontal } from 'lucide-react'

export const CATEGORIES = {
  travel: { label: 'Travel', icon: Plane, color: '#3b82f6' },
  food: { label: 'Food & Drinks', icon: Utensils, color: '#f59e0b' },
  accommodation: { label: 'Accommodation', icon: Building, color: '#8b5cf6' },
  activities: { label: 'Activities', icon: Compass, color: '#10b981' },
  shopping: { label: 'Shopping', icon: ShoppingBag, color: '#ec4899' },
  health: { label: 'Health & Medicine', icon: Heart, color: '#ef4444' },
  gifts: { label: 'Gifts', icon: Gift, color: '#f97316' },
  misc: { label: 'Miscellaneous', icon: MoreHorizontal, color: '#6b7280' },
} as const

export type CategoryKey = keyof typeof CATEGORIES
