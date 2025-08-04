import { useEffect, useRef } from 'react'
import type { Transaction } from '../../lib/db'
import './TransactionModal.css'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transactions: Transaction[]
  dateRange: {
    start: Date
    end: Date
  }
}

export function TransactionModal({ isOpen, onClose, transactions, dateRange }: TransactionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formatDate = (date: Date) => 
    date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

  const formatAmount = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount)

  const totalExpenditures = transactions
    .filter(t => t.transactionType === 'expenditure')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalDeposits = transactions
    .filter(t => t.transactionType === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0)

  // Get starting and ending balances
  const startingBalance = transactions.length > 0 ? transactions[0].runningBalance! - 
    (transactions[0].transactionType === 'deposit' ? transactions[0].amount : -transactions[0].amount) : 1000
  const endingBalance = transactions.length > 0 ? transactions[transactions.length - 1].runningBalance! : 1000

  return (
    <div className="modal-overlay">
      <div className="modal-content" ref={modalRef}>
        <div className="modal-header">
          <h2>Transaction Details</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <div className="modal-summary">
          <div className="summary-item">
            <span>Date Range:</span>
            <span>{formatDate(dateRange.start)} - {formatDate(dateRange.end)}</span>
          </div>
          <div className="summary-item">
            <span>Total Transactions:</span>
            <span>{transactions.length}</span>
          </div>
          <div className="summary-item">
            <span>Starting Balance:</span>
            <span className="balance">{formatAmount(startingBalance)}</span>
          </div>
          <div className="summary-item">
            <span>Ending Balance:</span>
            <span className="balance">{formatAmount(endingBalance)}</span>
          </div>
          <div className="summary-item">
            <span>Total Expenditures:</span>
            <span className="expenditure">{formatAmount(totalExpenditures)}</span>
          </div>
          <div className="summary-item">
            <span>Total Deposits:</span>
            <span className="deposit">{formatAmount(totalDeposits)}</span>
          </div>
        </div>

        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Location</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id} className={`transaction-type-${transaction.transactionType}`}>
                  <td>{formatDate(transaction.transactionDate)}</td>
                  <td>{transaction.description}</td>
                  <td>{transaction.location || 'N/A'}</td>
                  <td>{transaction.transactionType}</td>
                  <td className={transaction.transactionType}>
                    {formatAmount(transaction.amount)}
                  </td>
                  <td className="balance">
                    {formatAmount(transaction.runningBalance || 0)}
                  </td>
                  <td>{transaction.category || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 