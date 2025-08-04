export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      financial_transactions: {
        Row: {
          id: number
          transaction_date: string
          amount: number
          description: string
          location: string | null
          transaction_type: 'expenditure' | 'deposit' | 'uncertain'
          category: string | null
          created_at: string
        }
        Insert: {
          id?: number
          transaction_date: string
          amount: number
          description: string
          location?: string | null
          transaction_type: 'expenditure' | 'deposit' | 'uncertain'
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          transaction_date?: string
          amount?: number
          description?: string
          location?: string | null
          transaction_type?: 'expenditure' | 'deposit' | 'uncertain'
          category?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 