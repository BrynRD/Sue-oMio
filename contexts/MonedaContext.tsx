'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type TipoMoneda = 'PEN' | 'USD' | 'EUR'

interface MonedaContextType {
  monedaActual: TipoMoneda
  cambiarMoneda: (moneda: TipoMoneda) => void
  getSimboloMoneda: (moneda?: TipoMoneda) => string
  formatearPrecio: (precio: number | string, moneda?: TipoMoneda) => string
  getPrecioProducto: (producto: any, esOferta?: boolean) => number
}

const MonedaContext = createContext<MonedaContextType | undefined>(undefined)

export function useMoneda() {
  const context = useContext(MonedaContext)
  if (context === undefined) {
    throw new Error('useMoneda debe ser usado dentro de un MonedaProvider')
  }
  return context
}

interface MonedaProviderProps {
  children: React.ReactNode
}

export function MonedaProvider({ children }: MonedaProviderProps) {
  const [monedaActual, setMonedaActual] = useState<TipoMoneda>('PEN')

  // Cargar moneda guardada del localStorage al inicializar
  useEffect(() => {
    const monedaGuardada = localStorage.getItem('moneda-seleccionada') as TipoMoneda
    if (monedaGuardada && ['PEN', 'USD', 'EUR'].includes(monedaGuardada)) {
      setMonedaActual(monedaGuardada)
    }
  }, [])

  const cambiarMoneda = (moneda: TipoMoneda) => {
    setMonedaActual(moneda)
    localStorage.setItem('moneda-seleccionada', moneda)
  }

  const getSimboloMoneda = (moneda?: TipoMoneda): string => {
    const monedaAUsar = moneda || monedaActual
    switch (monedaAUsar) {
      case 'USD': return '$'
      case 'EUR': return '€'
      default: return 'S/'
    }
  }

  const formatearPrecio = (precio: number | string, moneda?: TipoMoneda): string => {
    const monedaAUsar = moneda || monedaActual
    const precioNumerico = typeof precio === 'string' ? parseFloat(precio) : precio
    return `${getSimboloMoneda(monedaAUsar)} ${precioNumerico.toFixed(2)}`
  }

  const getPrecioProducto = (producto: any, esOferta?: boolean): number => {
    if (!producto) return 0
    
    const usarOferta = esOferta !== undefined ? esOferta : producto.en_oferta
    let precio = 0
    
    switch (monedaActual) {
      case 'USD':
        precio = usarOferta && producto.precio_oferta_usd ? 
          parseFloat(producto.precio_oferta_usd) : parseFloat(producto.precio_usd || '0')
        break
      case 'EUR':
        precio = usarOferta && producto.precio_oferta_eur ? 
          parseFloat(producto.precio_oferta_eur) : parseFloat(producto.precio_eur || '0')
        break
      default:
        precio = usarOferta && producto.precio_oferta_pen ? 
          parseFloat(producto.precio_oferta_pen) : parseFloat(producto.precio_pen || '0')
    }
    
    return isNaN(precio) ? 0 : precio
  }

  const value = {
    monedaActual,
    cambiarMoneda,
    getSimboloMoneda,
    formatearPrecio,
    getPrecioProducto
  }

  return (
    <MonedaContext.Provider value={value}>
      {children}
    </MonedaContext.Provider>
  )
}
