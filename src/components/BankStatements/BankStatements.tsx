import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import type { BankStatement, Transaction } from '../../lib/db'
import { db } from '../../lib/db'
import { TransactionModal } from '../TransactionModal/TransactionModal'
import './BankStatements.css'

export function BankStatements() {
  const [statements, setStatements] = useState<BankStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadStatements()
  }, [])

  const loadStatements = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await db.getBankStatements()
      // Get the overall statement that spans all months
      const overallStatement = {
        id: 'overall',
        dateRange: {
          start: data[data.length - 1].dateRange.start,
          end: data[0].dateRange.end
        },
        transactionCount: data.reduce((sum, s) => sum + s.transactionCount, 0),
        startingBalance: data[data.length - 1].startingBalance,
        endingBalance: data[0].endingBalance,
        totalExpenditures: data.reduce((sum, s) => sum + s.totalExpenditures, 0),
        totalDeposits: data.reduce((sum, s) => sum + s.totalDeposits, 0)
      }
      setStatements([overallStatement])
    } catch (err) {
      setError('Failed to load bank statements')
      console.error('Error loading bank statements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatementClick = async (statement: BankStatement) => {
    try {
      setLoading(true)
      setError(null)
      const data = await db.getTransactionsWithBalance(statement.dateRange.start, statement.dateRange.end)
      setTransactions(data)
      setSelectedStatement(statement)
      setIsModalOpen(true)
    } catch (err) {
      setError('Failed to load transactions')
      console.error('Error loading transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
    const endStr = end.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
    return `${startStr} - ${endStr}`
  }

  const formatAmount = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount)

  const toggleOpen = () => {
    console.log('Toggle clicked, current isOpen:', isOpen)
    setIsOpen(!isOpen)
  }

  return (
    <div className="bank-statements">
      <div className="bank-statements-header">
      Bank Statements
        <button 
          onClick={toggleOpen} 
          className="toggle-button"
        >
          {isOpen ? 'Close' : 'Open'}
        </button>
      </div>
      
      {isOpen && (
        <>
          {loading && statements.length === 0 ? (
            <div className="bank-statements-loading">
              <span className="loading"></span>
              Loading bank statements...
            </div>
          ) : error && statements.length === 0 ? (
            <div className="bank-statements-error">
              {error}
              <button onClick={loadStatements} className="btn-retry">
                Retry
              </button>
            </div>
          ) : (
            <div className="statements-grid">
              {statements.map(statement => (
                <div 
                  key={statement.id}
                  className="statement-card"
                >
                  <div 
                    className="statement-header"
                    onClick={() => handleStatementClick(statement)}
                  >
                    <h3>{formatDateRange(statement.dateRange.start, statement.dateRange.end)}</h3>
                    <span className="transaction-count">
                      {statement.transactionCount} transactions
                    </span>
                  </div>
                  
                  <div className="statement-summary">
                    <div className="summary-item">
                      <span>Starting Balance</span>
                      <span className="balance">
                        {formatAmount(statement.startingBalance)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span>Ending Balance</span>
                      <span className="balance">
                        {formatAmount(statement.endingBalance)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span>Expenditures</span>
                      <span className="expenditure">
                        {formatAmount(statement.totalExpenditures)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span>Deposits</span>
                      <span className="deposit">
                        {formatAmount(statement.totalDeposits)}
                      </span>
                    </div>
                  </div>

                  <div className="statement-actions">
                    <Link
                      to="/balance-chart"
                      search={{ statementId: statement.id }}
                      className="view-chart-btn"
                    >
                      <span className="icon">📊</span>
                      View Balance Charts
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedStatement && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          transactions={transactions}
          dateRange={selectedStatement.dateRange}
        />
      )}
    </div>
  )
} 