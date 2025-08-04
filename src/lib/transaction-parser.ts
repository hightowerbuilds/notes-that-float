// Types
export interface ParsedTransaction {
  date?: string
  amount?: string
  location?: string
  description?: string
  category?: string
  rawText: string
  lineNumber: number
  isNewLine: boolean
}

export interface ParsedPage {
  pageNumber: number
  text: string
  paragraphs: string[]
  transactions: ParsedTransaction[]
  identifiedData: {
    dates: string[]
    amounts: string[]
    locations: string[]
    categories: string[]
  }
}

export interface ParsedDocument {
  pages: ParsedPage[]
  summary: {
    totalPages: number
    pageNumbers: number[]
    hasContent: boolean
    totalTransactions: number
    dateRange?: {
      earliest: string
      latest: string
    }
    amountRange?: {
      min: string
      max: string
      total: string
    }
    locations: string[]
    categories: string[]
  }
}

// Helper functions for parsing
const parseDate = (text: string): string[] => {
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,  // MM/DD/YYYY or MM/DD/YY
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,    // MM-DD-YYYY or MM-DD-YY
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g,  // Month DD, YYYY
    /\b\d{4}-\d{2}-\d{2}\b/g,          // YYYY-MM-DD
    /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g,  // MM.DD.YYYY or MM.DD.YY
    /\b\d{1,2}\s+\d{1,2}\s+\d{2,4}\b/g // MM DD YYYY or MM DD YY
  ]
  
  return datePatterns
    .flatMap(pattern => Array.from(text.matchAll(pattern)))
    .map(match => match[0])
    .filter((date, index, self) => self.indexOf(date) === index)
}

const parseAmount = (text: string): string[] => {
  const amountPatterns = [
    /\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g,  // Standard currency format
    /\b\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP|CAD|AUD)\b/gi,  // Amount with currency code
    /\b(?:USD|EUR|GBP|CAD|AUD)\s*\d+(?:\.\d{2})?\b/gi,  // Currency code with amount
    /\b\d+(?:\.\d{2})?\s*(?:dollars?|euros?|pounds?)\b/gi  // Amount with currency word
  ]
  
  return amountPatterns
    .flatMap(pattern => Array.from(text.matchAll(pattern)))
    .map(match => match[0])
    .filter((amount, index, self) => self.indexOf(amount) === index)
}

const parseLocation = (text: string): string[] => {
  const locationPatterns = [
    /\b(?:at|in|from|to|near|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Store|Shop|Market|Restaurant|Hotel|Bank|Office|Center|Mall|Location|Branch)\b/g,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:LLC|Inc|Corp|Company|Co|Ltd)\b/g,
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct)\b/g
  ]
  
  return locationPatterns
    .flatMap(pattern => Array.from(text.matchAll(pattern)))
    .map(match => match[1])
    .filter((loc, index, self) => self.indexOf(loc) === index)
}

const parseCategory = (text: string): string[] => {
  const categoryPatterns = [
    /\b(?:Food|Dining|Restaurant|Grocery|Market)\b/gi,
    /\b(?:Transport|Travel|Gas|Fuel|Parking|Uber|Lyft|Taxi)\b/gi,
    /\b(?:Shopping|Retail|Store|Mall|Online)\b/gi,
    /\b(?:Entertainment|Movie|Theater|Concert|Event)\b/gi,
    /\b(?:Utility|Bill|Payment|Service|Subscription)\b/gi,
    /\b(?:Health|Medical|Dental|Pharmacy|Insurance)\b/gi,
    /\b(?:Home|Housing|Rent|Mortgage|Maintenance)\b/gi
  ]
  
  return categoryPatterns
    .flatMap(pattern => Array.from(text.matchAll(pattern)))
    .map(match => match[0])
    .filter((cat, index, self) => self.indexOf(cat.toLowerCase()) === index)
}

const parseTransaction = (line: string, lineNumber: number): ParsedTransaction => {
  const dates = parseDate(line)
  const amounts = parseAmount(line)
  const locations = parseLocation(line)
  const categories = parseCategory(line)

  return {
    date: dates[0],
    amount: amounts[0],
    location: locations[0],
    category: categories[0],
    description: line,
    rawText: line,
    lineNumber,
    isNewLine: false
  }
}

// Main parsing function
export function parseTransactions(text: string): ParsedDocument {
  // Split the text into pages
  const pageSections = text.split(/\n\n--- Page \d+ ---\n\n/).filter(section => section.trim())
  
  // Get all page numbers
  const pageNumbers = Array.from(text.matchAll(/--- Page (\d+) ---/g))
    .map(match => parseInt(match[1], 10))

  const pages = pageSections.map((pageText, index) => {
    const pageNumber = pageNumbers[index] || index + 1
    const trimmedText = pageText.trim()
    
    // Split into lines, preserving empty lines
    const lines = trimmedText.split('\n')
    
    // Parse each line as a separate transaction
    const transactions = lines.map((line, lineIndex) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) {
        // For empty lines, create a transaction with just the line number
        return {
          rawText: '',
          lineNumber: lineIndex + 1,
          isNewLine: true
        } as ParsedTransaction
      }
      
      // Parse non-empty lines as transactions
      const parsed = parseTransaction(trimmedLine, lineIndex + 1)
      return {
        ...parsed,
        isNewLine: true // Mark all lines as new line endpoints
      }
    })

    // Split into paragraphs (keeping this for backward compatibility)
    const paragraphs = trimmedText
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0)

    // Collect all identified data from the page
    const identifiedData = {
      dates: parseDate(trimmedText),
      amounts: parseAmount(trimmedText),
      locations: parseLocation(trimmedText),
      categories: parseCategory(trimmedText)
    }

    return {
      pageNumber,
      text: trimmedText,
      paragraphs,
      transactions,
      identifiedData
    }
  })

  // Calculate overall document statistics
  const allTransactions = pages.flatMap(page => page.transactions)
  const allDates = pages.flatMap(page => page.identifiedData.dates)
  const allAmounts = pages.flatMap(page => page.identifiedData.amounts)
  const allLocations = [...new Set(pages.flatMap(page => page.identifiedData.locations))]
  const allCategories = [...new Set(pages.flatMap(page => page.identifiedData.categories))]

  // Calculate date range
  const dateRange = allDates.length > 0 ? {
    earliest: allDates.reduce((a, b) => a < b ? a : b),
    latest: allDates.reduce((a, b) => a > b ? a : b)
  } : undefined

  // Calculate amount range
  const amountRange = allAmounts.length > 0 ? {
    min: allAmounts.reduce((a, b) => parseFloat(a.replace(/[$,]/g, '')) < parseFloat(b.replace(/[$,]/g, '')) ? a : b),
    max: allAmounts.reduce((a, b) => parseFloat(a.replace(/[$,]/g, '')) > parseFloat(b.replace(/[$,]/g, '')) ? a : b),
    total: allAmounts
      .reduce((sum, amount) => sum + parseFloat(amount.replace(/[$,]/g, '')), 0)
      .toFixed(2)
  } : undefined

  return {
    pages,
    summary: {
      totalPages: pages.length,
      pageNumbers: pages.map(p => p.pageNumber),
      hasContent: pages.some(p => p.text.length > 0),
      totalTransactions: allTransactions.length,
      dateRange,
      amountRange,
      locations: allLocations,
      categories: allCategories
    }
  }
} 