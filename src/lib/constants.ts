import { ObservationType } from './types'

export const OBS_TYPES: {
  v: ObservationType
  emoji: string
  label: string
  color: string
}[] = [
  { v: 'health',     emoji: '🏥', label: 'Health',     color: '#3B82F6' },
  { v: 'aggression', emoji: '⚠️',  label: 'Aggression', color: '#EF4444' },
  { v: 'bite',       emoji: '🦷',  label: 'Bite',       color: '#DC2626' },
  { v: 'injury',     emoji: '🩹',  label: 'Injury',     color: '#F97316' },
  { v: 'feeding',    emoji: '🍚',  label: 'Feeding',    color: '#10B981' },
]
