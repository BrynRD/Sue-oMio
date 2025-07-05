export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Error de base de datos') {
    super(message, 500)
  }
}

export class PaymentError extends AppError {
  constructor(message: string) {
    super(message, 402)
  }
}

// Error handler para APIs
export const handleApiError = (error: any) => {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      error: error.message,
      isOperational: error.isOperational
    }
  }

  // Errores de base de datos MySQL
  if (error.code) {
    switch (error.code) {
      case 'ER_DUP_ENTRY':
        return {
          statusCode: 409,
          error: 'El registro ya existe',
          isOperational: true
        }
      case 'ER_NO_REFERENCED_ROW_2':
        return {
          statusCode: 400,
          error: 'Referencia inválida',
          isOperational: true
        }
      case 'ECONNREFUSED':
        return {
          statusCode: 503,
          error: 'Error de conexión a la base de datos',
          isOperational: false
        }
      default:
        return {
          statusCode: 500,
          error: 'Error interno del servidor',
          isOperational: false
        }
    }
  }

  // Error genérico
  return {
    statusCode: 500,
    error: 'Error interno del servidor',
    isOperational: false
  }
}

// Validaciones comunes
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' }
  }
  return { valid: true }
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[0-9]{9,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validateRequired = (value: any, fieldName: string): void => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} es requerido`)
  }
}

export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): void => {
  const num = Number(value)
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} debe ser un número válido`)
  }
  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} debe ser mayor o igual a ${min}`)
  }
  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} debe ser menor o igual a ${max}`)
  }
}

// Logger mejorado
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data || '')
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '')
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data || '')
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, data || '')
    }
  }
}

// Utilidades para respuestas de API
export const apiResponse = {
  success: (data: any, message?: string) => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }),
  
  error: (error: string, statusCode: number = 500, details?: any) => ({
    success: false,
    error,
    statusCode,
    details,
    timestamp: new Date().toISOString()
  }),
  
  paginated: (data: any[], page: number, limit: number, total: number) => ({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  })
}

// Rate limiting simple
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export const rateLimit = (identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean => {
  const now = Date.now()
  const record = requestCounts.get(identifier)
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

// Sanitización de datos
export const sanitizeString = (str: string): string => {
  return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/[<>]/g, '')
            .trim()
}

export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeString(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

// Utilidades de fecha
export const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Utilidades de precio
export const formatPrice = (price: number, currency: string = 'PEN'): string => {
  const formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency === 'PEN' ? 'PEN' : currency,
    minimumFractionDigits: 2
  })
  
  if (currency === 'PEN') {
    return `S/ ${price.toFixed(2)}`
  }
  
  return formatter.format(price)
}

// Debounce para optimizar búsquedas
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// Utilidades de archivo
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const isValidImageFile = (filename: string): boolean => {
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  return validExtensions.includes(getFileExtension(filename))
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
