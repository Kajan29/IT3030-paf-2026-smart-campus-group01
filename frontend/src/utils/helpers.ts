// Format date to readable string
export const formatDate = (date: string | number | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format date with time
export const formatDateTime = (date: string | number | Date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Truncate text
export const truncateText = (text: string, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Capitalize first letter
export const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Check if object is empty
export const isEmpty = (obj: Record<string, any>) => {
  return Object.keys(obj).length === 0
}

// Debounce function
export const debounce = (func: (...args: any[]) => void, wait = 300) => {
  let timeout: number | undefined
  return (...args: any[]) => {
    if (timeout) window.clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}
