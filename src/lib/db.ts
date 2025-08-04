import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Initialize the Supabase client lazily
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

const getSupabaseClient = () => {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      const missingVars = []
      if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL')
      if (!supabaseKey) missingVars.push('VITE_SUPABASE_ANON_KEY')
      throw new Error(`Missing required Supabase environment variables: ${missingVars.join(', ')}. Please add these to your deployment environment variables.`)
    }

    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey)
  }
  return supabaseClient
}

export const supabase = getSupabaseClient()

export interface LifeNote {
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

// Test the connection
export async function testConnection() {
  try {
    const { data: _data, error } = await supabase.from('life_notes').select('count').limit(1)
    if (error) throw error
    console.log('Database connection successful!')
    return true
  } catch (err) {
    console.error('Database connection test failed:', err)
    return false
  }
}

export interface DB {
  getLifeNotesForMonth(month: number, year: number, userId: string): Promise<LifeNote[]>
  getLifeNotesForDay(dayString: string, month: number, year: number, userId: string): Promise<LifeNote[]>
  addLifeNote(note: {
    day_string: string
    content: string
    note_date: string
    month: number
    year: number
    user_id: string
  }): Promise<LifeNote>
  updateLifeNote(id: string, content: string, userId: string): Promise<LifeNote>
  deleteLifeNote(id: string, userId: string): Promise<void>
}

export const db: DB = {
  // Life Notes operations
  async getLifeNotesForMonth(month: number, year: number, userId: string): Promise<LifeNote[]> {
    const { data, error } = await supabase
      .from('life_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .order('note_date', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async getLifeNotesForDay(dayString: string, month: number, year: number, userId: string): Promise<LifeNote[]> {
    const { data, error } = await supabase
      .from('life_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('day_string', dayString)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  },

  async addLifeNote(note: {
    day_string: string
    content: string
    note_date: string
    month: number
    year: number
    user_id: string
  }): Promise<LifeNote> {
    const { data, error } = await supabase
      .from('life_notes')
      .insert(note)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateLifeNote(id: string, content: string, userId: string): Promise<LifeNote> {
    const { data, error } = await supabase
      .from('life_notes')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)  // Security: only update own notes
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteLifeNote(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('life_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)  // Security: only delete own notes

    if (error) throw error
  }
}