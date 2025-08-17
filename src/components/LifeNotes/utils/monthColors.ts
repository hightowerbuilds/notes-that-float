// Month color mapping - each month has its own gradient colors
export const monthColors = [
  // January - Deep Purple to Light Purple
  { light: [0.8, 0.4, 0.8], dark: [0.4, 0.0, 0.4] },
  // February - Pink to Deep Pink
  { light: [1.0, 0.6, 0.8], dark: [0.6, 0.2, 0.4] },
  // March - Green to Dark Green
  { light: [0.4, 0.8, 0.4], dark: [0.0, 0.4, 0.0] },
  // April - Light Blue to Blue
  { light: [0.6, 0.8, 1.0], dark: [0.2, 0.4, 0.8] },
  // May - Yellow to Orange
  { light: [1.0, 0.8, 0.4], dark: [0.8, 0.4, 0.0] },
  // June - Orange to Red
  { light: [1.0, 0.6, 0.2], dark: [0.8, 0.2, 0.0] },
  // July - Red to Dark Red
  { light: [1.0, 0.4, 0.4], dark: [0.6, 0.0, 0.0] },
  // August - Orange to Brown
  { light: [1.0, 0.5, 0.2], dark: [0.6, 0.3, 0.0] },
  // September - Gold to Brown
  { light: [1.0, 0.8, 0.2], dark: [0.6, 0.4, 0.0] },
  // October - Orange to Dark Orange
  { light: [1.0, 0.6, 0.0], dark: [0.8, 0.3, 0.0] },
  // November - Brown to Dark Brown
  { light: [0.8, 0.6, 0.4], dark: [0.4, 0.2, 0.0] },
  // December - Blue to Dark Blue
  { light: [0.4, 0.6, 1.0], dark: [0.0, 0.2, 0.6] }
]

// Helper to get day of the week
export const getDayOfWeek = (year: number, month: number, day: number) => {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][
    new Date(year, month, day).getDay()
  ]
}

// Convert RGB array to hex color for torus rings
export const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Month names
export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
