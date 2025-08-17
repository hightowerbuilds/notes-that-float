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
      life_notes: {
        Row: {
          id: string
          user_id: string
          day_string: string
          content: string
          note_date: string
          month: number
          year: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_string: string
          content: string
          note_date: string
          month: number
          year: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_string?: string
          content?: string
          note_date?: string
          month?: number
          year?: number
          created_at?: string
          updated_at?: string
        }
      }
      writing_documents: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          word_count: number
          character_count: number
          created_at: string
          updated_at: string
          last_opened: string
          is_favorite: boolean
          tags: string[]
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          content?: string
          word_count?: number
          character_count?: number
          created_at?: string
          updated_at?: string
          last_opened?: string
          is_favorite?: boolean
          tags?: string[]
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          word_count?: number
          character_count?: number
          created_at?: string
          updated_at?: string
          last_opened?: string
          is_favorite?: boolean
          tags?: string[]
          metadata?: Json
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