import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db, testConnection } from './db'
import { createClient } from '@supabase/supabase-js'

// Create a simpler mock structure
const createMockSupabaseQuerySimple = (returnData: any, returnError: any = null) => ({
  select: vi.fn(() => ({
    limit: vi.fn(() => Promise.resolve({ data: returnData, error: returnError }))
  }))
})

const createMockSupabaseQueryOrder = (returnData: any, returnError: any = null) => ({
  select: vi.fn(() => ({
    order: vi.fn(() => Promise.resolve({ data: returnData, error: returnError }))
  }))
})

const createMockSupabaseQueryDateRange = (returnData: any, returnError: any = null) => ({
  select: vi.fn(() => ({
    gte: vi.fn(() => ({
      lte: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: returnData, error: returnError }))
      }))
    }))
  }))
})

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}))

describe('Database Functions', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create a fresh mock client for each test
    mockSupabaseClient = {
      from: vi.fn()
    }
    
    // Set up the mock to return our client
    vi.mocked(createClient).mockReturnValue(mockSupabaseClient)
  })

  describe('testConnection', () => {
    it('returns true when connection is successful', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseQuerySimple([{}], null)
      )

      const result = await testConnection()
      expect(result).toBe(true)
    })

    it('returns false when connection fails', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseQuerySimple(null, new Error('Connection failed'))
      )

      const result = await testConnection()
      expect(result).toBe(false)
    })
  })

  describe('getBankStatements', () => {
    it('returns formatted bank statements', async () => {
      const mockTransactions = [
        {
          id: 1,
          transaction_date: '2025-06-01T10:00:00Z',
          amount: 100,
          transaction_type: 'deposit',
          description: 'Test deposit',
          location: 'Test location',
          category: 'Test category'
        },
        {
          id: 2,
          transaction_date: '2025-06-02T10:00:00Z',
          amount: 50,
          transaction_type: 'expenditure',
          description: 'Test expense',
          location: 'Test location',
          category: 'Test category'
        }
      ]

      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseQueryOrder(mockTransactions, null)
      )

      const statements = await db.getBankStatements()
      
      expect(statements).toBeDefined()
      expect(Array.isArray(statements)).toBe(true)
      expect(statements.length).toBeGreaterThan(0)
    })

    it('handles empty transaction data', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseQueryOrder([], null)
      )

      const statements = await db.getBankStatements()
      
      expect(statements).toBeDefined()
      expect(Array.isArray(statements)).toBe(true)
      expect(statements.length).toBe(0)
    })

    it('throws error when database query fails', async () => {
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseQueryOrder(null, new Error('Database error'))
      )

      await expect(db.getBankStatements()).rejects.toThrow('Database error')
    })
  })

  describe('getTransactions', () => {
    it('returns transactions for date range', async () => {
      const mockTransactions = [
        {
          id: 1,
          transaction_date: '2025-06-01T10:00:00Z',
          amount: 100,
          transaction_type: 'deposit',
          description: 'Test deposit',
          location: 'Test location',
          category: 'Test category'
        }
      ]

      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseQueryDateRange(mockTransactions, null)
      )

      const startDate = new Date('2025-06-01')
      const endDate = new Date('2025-06-30')
      const transactions = await db.getTransactions(startDate, endDate)
      
      expect(transactions).toBeDefined()
      expect(Array.isArray(transactions)).toBe(true)
      expect(transactions.length).toBe(1)
      expect(transactions[0]).toHaveProperty('id')
      expect(transactions[0]).toHaveProperty('transactionDate')
      expect(transactions[0]).toHaveProperty('amount')
    })
  })

  describe('getTransactionsByStatementId', () => {
    it('returns transactions for specific statement', async () => {
      const mockTransactions = [
        {
          id: 1,
          transaction_date: '2025-06-01T10:00:00Z',
          amount: 100,
          transaction_type: 'deposit',
          description: 'Test deposit',
          location: 'Test location',
          category: 'Test category'
        }
      ]

      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseQueryOrder(mockTransactions, null)
      )

      const transactions = await db.getTransactionsByStatementId('2025-06')
      
      expect(transactions).toBeDefined()
      expect(Array.isArray(transactions)).toBe(true)
      expect(transactions.length).toBe(1)
    })
  })
}) 