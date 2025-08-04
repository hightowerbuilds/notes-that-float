import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  username: string
  email?: string
  created_at: string
  last_login?: string
  is_active: boolean
  profile_data?: any
}

export interface AuthError {
  message: string
  code?: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface SignupCredentials {
  username: string
  password: string
  email?: string
}

// Hash password using bcrypt
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Verify password against hash
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash)
}

// Store user session in localStorage
const storeUserSession = (user: User) => {
  localStorage.setItem('user_session', JSON.stringify({
    user,
    timestamp: Date.now()
  }))
}

// Get user session from localStorage
const getUserSession = (): User | null => {
  try {
    const session = localStorage.getItem('user_session')
    if (!session) return null
    
    const { user, timestamp } = JSON.parse(session)
    const now = Date.now()
    const sessionAge = now - timestamp
    
    // Session expires after 24 hours
    if (sessionAge > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('user_session')
      return null
    }
    
    return user
  } catch (error) {
    localStorage.removeItem('user_session')
    return null
  }
}

// Clear user session
const clearUserSession = () => {
  localStorage.removeItem('user_session')
}

// Check if username exists
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error checking username:', error)
    throw new Error('Failed to check username availability')
  }
}

// Check if email exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error checking email:', error)
    throw new Error('Failed to check email availability')
  }
}

// Register new user
export const registerUser = async (credentials: SignupCredentials): Promise<User> => {
  try {
    // Check if username already exists
    const usernameExists = await checkUsernameExists(credentials.username)
    if (usernameExists) {
      throw new Error('Username already exists')
    }

    // Check if email already exists (if provided)
    if (credentials.email) {
      const emailExists = await checkEmailExists(credentials.email)
      if (emailExists) {
        throw new Error('Email already exists')
      }
    }

    // Hash the password
    const passwordHash = await hashPassword(credentials.password)

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert({
        username: credentials.username,
        email: credentials.email || null,
        password_hash: passwordHash,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Registration error:', error)
      throw new Error('Failed to create account')
    }

    if (!data) {
      throw new Error('Failed to create account')
    }

    // Return user data (without password hash)
    const user: User = {
      id: data.id,
      username: data.username,
      email: data.email,
      created_at: data.created_at,
      last_login: data.last_login,
      is_active: data.is_active,
      profile_data: data.profile_data
    }

    // Store session
    storeUserSession(user)

    return user
  } catch (error) {
    console.error('Registration error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to create account')
  }
}

// Login user
export const loginUser = async (credentials: LoginCredentials): Promise<User> => {
  try {
    // Get user by username
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', credentials.username)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Login error:', error)
      throw new Error('Invalid username or password')
    }

    if (!data) {
      throw new Error('Invalid username or password')
    }

    // Verify password
    const isValidPassword = await verifyPassword(credentials.password, data.password_hash)
    if (!isValidPassword) {
      throw new Error('Invalid username or password')
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id)

    // Return user data (without password hash)
    const user: User = {
      id: data.id,
      username: data.username,
      email: data.email,
      created_at: data.created_at,
      last_login: data.last_login,
      is_active: data.is_active,
      profile_data: data.profile_data
    }

    // Store session
    storeUserSession(user)

    return user
  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to login')
  }
}

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // First check localStorage for existing session
    const sessionUser = getUserSession()
    if (sessionUser) {
      return sessionUser
    }

    // If no session, return null
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    // Clear session
    clearUserSession()
  } catch (error) {
    console.error('Logout error:', error)
    throw new Error('Failed to logout')
  }
} 