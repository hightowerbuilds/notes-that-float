import { createFileRoute, useSearch } from '@tanstack/react-router'
import { Navbar } from '../../components/Navbar/Navbar'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { Transaction } from '../../lib/db'
import { db } from '../../lib/db'
import './balance-chart.css'

export const Route = createFileRoute('/balance-chart/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      statementId: search.statementId as string,
    }
  },
  component: BalanceChartPage,
})

function BalanceChartPage() {
  const { statementId } = useSearch({ from: '/balance-chart/' })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const svgRefs = useRef<(SVGSVGElement | null)[]>([null, null])

  useEffect(() => {
    loadTransactions()
  }, [statementId])

  const loadTransactions = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading transactions for statement:', statementId)
      const data = await db.getTransactionsByStatementId(statementId)
      console.log('Loaded transactions:', data)
      setTransactions(data)
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  // Calculate overall date range and prepare transactions
  const dateRange = transactions.length > 0 ? {
    start: new Date(Math.min(...transactions.map(t => new Date(t.transactionDate).getTime()))),
    end: new Date(Math.max(...transactions.map(t => new Date(t.transactionDate).getTime())))
  } : { start: new Date(), end: new Date() }

  // Sort all transactions by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  )

  useEffect(() => {
    if (!transactions.length || !svgRefs.current[0] || !svgRefs.current[1]) {
      console.log('No transactions or SVG refs:', { 
        transactionsLength: transactions.length, 
        hasLineChartRef: !!svgRefs.current[0],
        hasBarChartRef: !!svgRefs.current[1]
      })
      return
    }

    console.log('Creating charts with transactions:', transactions)

    // Clear any existing charts
    svgRefs.current.forEach(ref => {
      if (ref) {
        d3.select(ref).selectAll('*').remove()
      }
    })

    // Set up the chart dimensions
    const margin = { top: 40, right: 40, bottom: 60, left: 80 }
    const width = 1600 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    // Create both charts
    const createLineChart = (svgRef: SVGSVGElement) => {
      const svg = d3.select(svgRef)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      // Sort transactions by date
      const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
      )

      // Create scales
      const x = d3.scaleTime()
        .domain([
          new Date(sortedTransactions[0].transactionDate),
          new Date(sortedTransactions[sortedTransactions.length - 1].transactionDate)
        ])
        .range([0, width])

      const y = d3.scaleLinear()
        .domain([
          d3.min(sortedTransactions, d => d.runningBalance || 0) as number,
          d3.max(sortedTransactions, d => d.runningBalance || 0) as number
        ])
        .range([height, 0])
        .nice()

      // Add grid lines
      svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
        )
        .attr('stroke', 'var(--dark-border)')
        .attr('stroke-opacity', 0.3)

      // Add X axis with daily ticks
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
          .ticks(d3.timeDay.every(1))
          .tickFormat(d => {
            const date = d as Date
            return date.toLocaleDateString('en-US', { 
              month: 'numeric',
              day: 'numeric'
            })
          })
        )
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .style('font-size', '10px')

      // Add Y axis with currency formatting
      svg.append('g')
        .call(d3.axisLeft(y)
          .ticks(5)
          .tickFormat(d => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(d as number))
        )

      // Add title with date range
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(`${dateRange.start.toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC'
        })} - ${dateRange.end.toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC'
        })}`)

      // Add the line
      const line = d3.line<Transaction>()
        .x(d => x(new Date(d.transactionDate)))
        .y(d => y(d.runningBalance || 0))
        .curve(d3.curveMonotoneX)

      // Add area under the line
      const area = d3.area<Transaction>()
        .x(d => x(new Date(d.transactionDate)))
        .y0(height)
        .y1(d => y(d.runningBalance || 0))
        .curve(d3.curveMonotoneX)

      svg.append('path')
        .datum(sortedTransactions)
        .attr('class', 'area')
        .attr('d', area)

      svg.append('path')
        .datum(sortedTransactions)
        .attr('class', 'line')
        .attr('fill', 'none')
        .attr('d', line)

      // Add dots
      svg.selectAll<SVGCircleElement, Transaction>('circle')
        .data(sortedTransactions)
        .enter()
        .append('circle')
        .attr('cx', d => x(new Date(d.transactionDate)))
        .attr('cy', d => y(d.runningBalance || 0))
        .attr('r', 4)
        .on('mouseover', function(event: MouseEvent, d) {
          d3.select(this)
            .attr('r', 6)

          const tooltip = d3.select('body').append('div')
            .attr('class', 'chart-tooltip')
            .style('opacity', 0)

          tooltip.transition()
            .duration(200)
            .style('opacity', 1)

          tooltip.html(`
            <div>Date: ${new Date(d.transactionDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</div>
            <div>Balance: ${new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(d.runningBalance || 0)}</div>
          `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px')
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('r', 4)
          d3.selectAll('.chart-tooltip').remove()
        })
    }

    const createBarChart = (svgRef: SVGSVGElement) => {
      const svg = d3.select(svgRef)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      // Create scales
      const x = d3.scaleTime()
        .domain([dateRange.start, dateRange.end])
        .range([0, width])

      const y = d3.scaleLinear()
        .domain([
          0,
          d3.max(transactions, d => Math.abs(d.amount)) || 0
        ])
        .range([height, 0])
        .nice()

      const color = d3.scaleOrdinal<string>()
        .domain(['deposit', 'expenditure', 'uncertain'])
        .range(['var(--success-color)', 'var(--error-color)', 'var(--warning-color)'])

      // Add grid lines
      svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
          .ticks(10)
          .tickSize(-width)
          .tickFormat(() => '')
        )
        .attr('stroke', 'var(--dark-border)')
        .attr('stroke-opacity', 0.3)

      // Add X axis with daily ticks
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
          .ticks(d3.timeDay.every(1))
          .tickFormat(d => {
            const date = d as Date
            return date.toLocaleDateString('en-US', { 
              month: 'numeric',
              day: 'numeric'
            })
          })
        )
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .style('font-size', '10px')

      // Add Y axis with currency formatting
      svg.append('g')
        .call(d3.axisLeft(y)
          .ticks(10)
          .tickFormat(d => new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(d as number))
        )

      // Group transactions by date
      const transactionsByDate = new Map<string, Transaction[]>()
      sortedTransactions.forEach(transaction => {
        const date = new Date(transaction.transactionDate).toISOString().split('T')[0]
        if (!transactionsByDate.has(date)) {
          transactionsByDate.set(date, [])
        }
        transactionsByDate.get(date)?.push(transaction)
      })

      // Calculate bar width based on number of transactions per day
      const maxTransactionsPerDay = Math.max(...Array.from(transactionsByDate.values()).map(txs => txs.length))
      const barWidth = Math.min(
        width / (dateRange.end.getTime() - dateRange.start.getTime()) * (24 * 60 * 60 * 1000),
        width / (maxTransactionsPerDay * 2) // Ensure bars don't overlap too much
      )

      // Add bars for each transaction
      sortedTransactions.forEach(transaction => {
        const date = new Date(transaction.transactionDate)
        const xPos = x(date)
        const amount = Math.abs(transaction.amount)
        const barHeight = y(0) - y(amount)
        
        // Calculate offset for multiple transactions on same day
        const sameDayTransactions = transactionsByDate.get(date.toISOString().split('T')[0]) || []
        const transactionIndex = sameDayTransactions.findIndex(t => t.id === transaction.id)
        const xOffset = (transactionIndex - (sameDayTransactions.length - 1) / 2) * barWidth

        // Create bar group
        const barGroup = svg.append('g')
          .attr('class', 'transaction-bar')
          .attr('transform', `translate(${xPos + xOffset - barWidth/2},${y(amount)})`)

        // Add the bar
        barGroup.append('rect')
          .attr('class', 'bar')
          .attr('width', barWidth)
          .attr('height', barHeight)
          .attr('fill', color(transaction.transactionType))
          .attr('opacity', 0.7)
          .on('mouseover', function(event: MouseEvent) {
            d3.select(this)
              .attr('opacity', 1)

            const tooltip = d3.select('body').append('div')
              .attr('class', 'chart-tooltip')
              .style('opacity', 0)

            tooltip.transition()
              .duration(200)
              .style('opacity', 1)

            tooltip.html(`
              <div>Date: ${date.toLocaleDateString('en-US', { timeZone: 'UTC' })}</div>
              <div>Description: ${transaction.description}</div>
              <div>Amount: ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(transaction.amount)}</div>
              <div>Running Balance: ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(transaction.runningBalance || 0)}</div>
            `)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 28) + 'px')
          })
          .on('mouseout', function() {
            d3.select(this)
              .attr('opacity', 0.7)
            d3.selectAll('.chart-tooltip').remove()
          })

        // Add value label if the bar is tall enough
        if (barHeight > 20) {
          barGroup.append('text')
            .attr('class', 'value-label')
            .attr('x', barWidth / 2)
            .attr('y', barHeight / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '10px')
            .style('fill', 'var(--dark-text)')
            .text(new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(transaction.amount))
        }
      })
    }

    // Create both charts
    if (svgRefs.current[0]) createLineChart(svgRefs.current[0])
    if (svgRefs.current[1]) createBarChart(svgRefs.current[1])

  }, [transactions])

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="balance-chart-content">
            <div className="loading">Loading chart data...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="main-content">
          <div className="balance-chart-content">
            <div className="error">
              {error}
              <button onClick={loadTransactions} className="btn-retry">
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-container">
      <Navbar />
      <main className="main-content">
        <div className="balance-chart-content">
          <header>
            <h1 className="page-title">Balance Charts</h1>
            <p className="page-description">Transaction history and balance trends</p>
          </header>

          <div className="charts-container">
            <div className="chart-wrapper">
              <h2 className="chart-title">Balance Over Time</h2>
              <svg ref={(el: SVGSVGElement | null) => {
                svgRefs.current[0] = el
              }}></svg>
            </div>
            <div className="chart-wrapper">
              <h2 className="chart-title">Transaction History</h2>
              <svg ref={(el: SVGSVGElement | null) => {
                svgRefs.current[1] = el
              }}></svg>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 