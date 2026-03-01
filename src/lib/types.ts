export type DogStatus       = 'safe' | 'caution' | 'alert'
export type DogGender       = 'male' | 'female' | 'unknown'
export type DogSize         = 'small' | 'medium' | 'large'
export type VaccinationStatus   = 'yes' | 'no' | 'unknown'
export type SterilizationStatus = 'yes' | 'no' | 'unknown'
export type TemperamentType = 'friendly' | 'neutral' | 'alert'
export type ObservationType = 'health' | 'aggression' | 'bite' | 'injury' | 'feeding'
export type BiteSeverity    = 'scratch' | 'skin_break' | 'severe'
export type AgeGroup        = 'child' | 'adult' | 'elderly' | 'unknown'

export interface Dog {
  id: string
  name: string
  photoURL: string
  latitude: number
  longitude: number
  gender: DogGender
  size: DogSize
  vaccinated: VaccinationStatus
  sterilized: SterilizationStatus
  temperament: TemperamentType
  status: DogStatus
  riskScore: number
  biteCount: number
  observationCount: number
  aggressionConfirmations: number
  registeredBy: string
  registeredAt: string
  physicalMarkers?: string[]   // e.g. ['no_tail', 'left_ear_notch', 'white_head_patch']
  markerNotes?: string         // free-text: "large scar on left shoulder"
  notes?: string
}

export interface Observation {
  id: string
  dogId: string
  type: ObservationType
  description: string
  photoURL?: string
  videoURL?: string
  reportedBy: string
  timestamp: string
  biteSeverity?: BiteSeverity
  victimAgeGroup?: AgeGroup
  antiRabiesTaken?: 'yes' | 'no' | 'unknown'
  confirmed: boolean
  confirmations: number
}
