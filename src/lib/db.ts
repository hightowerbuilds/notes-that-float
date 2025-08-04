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

export interface Transaction {
  id: number
  transactionDate: Date
  amount: number
  description: string
  location: string
  transactionType: 'expenditure' | 'deposit' | 'uncertain'
  category: string | null
  createdAt: Date
  runningBalance?: number  // Optional field for balance tracking
}

export interface BankStatement {
  id: string
  dateRange: {
    start: Date
    end: Date
  }
  transactionCount: number
  startingBalance: number
  endingBalance: number
  totalExpenditures: number
  totalDeposits: number
}

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
    const { data: _data, error } = await supabase.from('financial_transactions').select('count').limit(1)
    if (error) throw error
    console.log('Database connection successful!')
    return true
  } catch (err) {
    console.error('Database connection test failed:', err)
    return false
  }
}

// Remove the automatic call - let tests call it explicitly
// testConnection()

export interface DB {
  getBankStatements(): Promise<BankStatement[]>
  getTransactions(startDate: Date, endDate: Date): Promise<Transaction[]>
  getTransactionsWithBalance(startDate: Date, endDate: Date, initialBalance?: number): Promise<Transaction[]>
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
  getTransactionsByStatementId(statementId: string): Promise<Transaction[]>
}

export const db: DB = {
  // Get all bank statements (grouped by date ranges)
  async getBankStatements(): Promise<BankStatement[]> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .order('transaction_date', { ascending: true })

    if (error) throw error

    console.log('All transactions:', data.map(t => ({
      date: t.transaction_date,
      month: new Date(t.transaction_date).getUTCMonth() + 1,
      year: new Date(t.transaction_date).getUTCFullYear()
    })))

    // Group transactions by month, ensuring we use the correct month boundaries
    const transactionsByMonth = data.reduce((acc, transaction) => {
      const date = new Date(transaction.transaction_date)
      // Use UTC to avoid timezone issues
      const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = []
      }
      acc[monthKey].push(transaction)
      return acc
    }, {} as Record<string, typeof data>)

    console.log('Grouped transactions by month:', Object.entries(transactionsByMonth).map(([monthKey, transactions]) => ({
      monthKey,
      count: (transactions as typeof data).length,
      firstDate: (transactions as typeof data)[0].transaction_date,
      lastDate: (transactions as typeof data)[(transactions as typeof data).length - 1].transaction_date
    })))

    // Calculate running balance across all transactions first
    let runningBalance = 1000 // Initial balance
    const allTransactions = data.sort((a, b) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    )

    // Create a map of running balances for each transaction
    const runningBalances = new Map<number, number>()
    allTransactions.forEach((transaction) => {
      if (transaction.transaction_type === 'expenditure') {
        runningBalance -= transaction.amount
      } else if (transaction.transaction_type === 'deposit') {
        runningBalance += transaction.amount
      }
      runningBalances.set(transaction.id, runningBalance)
    })

    // Create a statement for each month
    const statements: BankStatement[] = Object.entries(transactionsByMonth).map(([monthKey, monthTransactions]) => {
      const sortedTransactions = (monthTransactions as typeof data).sort((a, b) => 
        new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      )

      const firstTransaction = sortedTransactions[0]
      const lastTransaction = sortedTransactions[sortedTransactions.length - 1]

      // Get the starting balance from the first transaction's running balance
      const startingBalance = runningBalances.get(firstTransaction.id)! - 
        (firstTransaction.transaction_type === 'deposit' ? firstTransaction.amount : -firstTransaction.amount)

      // Get the ending balance from the last transaction's running balance
      const endingBalance = runningBalances.get(lastTransaction.id)!

      // Create proper date objects using UTC
      const startDate = new Date(firstTransaction.transaction_date)
      const endDate = new Date(lastTransaction.transaction_date)
      
      // Set the time to the start/end of the day
      startDate.setUTCHours(0, 0, 0, 0)
      endDate.setUTCHours(23, 59, 59, 999)

      const statement = {
        id: monthKey,
        dateRange: {
          start: startDate,
          end: endDate
        },
        totalExpenditures: sortedTransactions
          .filter((t: typeof data[0]) => t.transaction_type === 'expenditure')
          .reduce((sum: number, t: typeof data[0]) => sum + t.amount, 0),
        totalDeposits: sortedTransactions
          .filter((t: typeof data[0]) => t.transaction_type === 'deposit')
          .reduce((sum: number, t: typeof data[0]) => sum + t.amount, 0),
        transactionCount: sortedTransactions.length,
        startingBalance,
        endingBalance
      }

      console.log('Created statement:', {
        monthKey,
        startDate: statement.dateRange.start.toISOString(),
        endDate: statement.dateRange.end.toISOString(),
        transactionCount: statement.transactionCount
      })

      return statement
    })

    const sortedStatements = statements.sort((a, b) => 
      new Date(b.dateRange.start).getTime() - new Date(a.dateRange.start).getTime()
    )

    console.log('Final sorted statements:', sortedStatements.map(s => ({
      id: s.id,
      start: s.dateRange.start.toISOString(),
      end: s.dateRange.end.toISOString()
    })))

    return sortedStatements
  },

  // Get transactions for a specific date range
  async getTransactions(startDate: Date, endDate: Date): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .order('transaction_date', { ascending: false })

    if (error) throw error

    return data.map(transaction => ({
      id: transaction.id,
      transactionDate: new Date(transaction.transaction_date),
      amount: transaction.amount,
      description: transaction.description,
      location: transaction.location,
      transactionType: transaction.transaction_type,
      category: transaction.category,
      createdAt: new Date(transaction.created_at)
    }))
  },

  // Get transactions with running balance for a specific date range
  async getTransactionsWithBalance(startDate: Date, endDate: Date, initialBalance: number = 1000): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .order('transaction_date', { ascending: true })  // Get transactions in chronological order

    if (error) throw error

    let runningBalance = initialBalance
    const transactionsWithBalance = data.map(transaction => {
      // Calculate new balance based on transaction type
      if (transaction.transaction_type === 'expenditure') {
        runningBalance -= transaction.amount
      } else if (transaction.transaction_type === 'deposit') {
        runningBalance += transaction.amount
      }

      return {
        id: transaction.id,
        transactionDate: new Date(transaction.transaction_date),
        amount: transaction.amount,
        description: transaction.description,
        location: transaction.location,
        transactionType: transaction.transaction_type,
        category: transaction.category,
        createdAt: new Date(transaction.created_at),
        runningBalance
      }
    })

    return transactionsWithBalance  // Return in chronological order (earliest first)
  },

  async getTransactionsByStatementId(statementId: string): Promise<Transaction[]> {
    // For the overall statement, get all transactions
    if (statementId === 'overall') {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: true })

      if (error) throw error

      let runningBalance = 1000 // Initial balance
      return data.map(transaction => {
        if (transaction.transaction_type === 'expenditure') {
          runningBalance -= transaction.amount
        } else if (transaction.transaction_type === 'deposit') {
          runningBalance += transaction.amount
        }

        return {
          id: transaction.id,
          transactionDate: new Date(transaction.transaction_date),
          amount: transaction.amount,
          description: transaction.description,
          location: transaction.location,
          transactionType: transaction.transaction_type,
          category: transaction.category,
          createdAt: new Date(transaction.created_at),
          runningBalance
        }
      })
    }

    // For monthly statements, get transactions for that month
    // Parse the month key to get the year and month
    const [year, month] = statementId.split('-').map(Number)
    
    // Create date objects for the start and end of the month
    const startDate = new Date(Date.UTC(year, month - 1, 1))
    const endDate = new Date(Date.UTC(year, month, 0)) // Last day of the month

    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .order('transaction_date', { ascending: true })

    if (error) throw error

    // Get the starting balance from the previous month's ending balance
    const statements = await this.getBankStatements()
    const currentStatementIndex = statements.findIndex(s => s.id === statementId)
    const startingBalance = currentStatementIndex < statements.length - 1 
      ? statements[currentStatementIndex + 1].endingBalance 
      : 1000 // If it's the earliest month, use initial balance

    let runningBalance = startingBalance
    return data.map(transaction => {
      if (transaction.transaction_type === 'expenditure') {
        runningBalance -= transaction.amount
      } else if (transaction.transaction_type === 'deposit') {
        runningBalance += transaction.amount
      }

      return {
        id: transaction.id,
        transactionDate: new Date(transaction.transaction_date),
        amount: transaction.amount,
        description: transaction.description,
        location: transaction.location,
        transactionType: transaction.transaction_type,
        category: transaction.category,
        createdAt: new Date(transaction.created_at),
        runningBalance
      }
    })
  },

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