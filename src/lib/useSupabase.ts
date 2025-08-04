import { supabase } from './supabase'

export function useSupabase() {
  return {
    supabase,
    // Add any common Supabase operations here
    // For example:
    // async getUser() {
    //   const { data: { user } } = await supabase.auth.getUser()
    //   return user
    // }
  }
} 