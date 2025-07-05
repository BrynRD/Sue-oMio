'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'

export interface ProductoCarrito {
  id: number
  nombre: string
  precio: number
  imagen: string
  talla: string
  color: string
  cantidad: number
  stock: number
}

interface EstadoCarrito {
  items: ProductoCarrito[]
  total: number
  cantidadTotal: number
  mostrarCarrito: boolean
}

type AccionCarrito = 
  | { type: 'AGREGAR_ITEM'; payload: Omit<ProductoCarrito, 'cantidad'> }
  | { type: 'REMOVER_ITEM'; payload: { id: number; talla: string; color: string } }
  | { type: 'ACTUALIZAR_CANTIDAD'; payload: { id: number; talla: string; color: string; cantidad: number } }
  | { type: 'LIMPIAR_CARRITO' }
  | { type: 'TOGGLE_CARRITO' }
  | { type: 'CARGAR_CARRITO'; payload: ProductoCarrito[] }

const estadoInicial: EstadoCarrito = {
  items: [],
  total: 0,
  cantidadTotal: 0,
  mostrarCarrito: false
}

function carritoReducer(estado: EstadoCarrito, accion: AccionCarrito): EstadoCarrito {
  switch (accion.type) {
    case 'AGREGAR_ITEM': {
      const itemExistente = estado.items.find(
        item => item.id === accion.payload.id && 
                item.talla === accion.payload.talla && 
                item.color === accion.payload.color
      )

      let nuevosItems: ProductoCarrito[]

      if (itemExistente) {
        nuevosItems = estado.items.map(item =>
          item.id === accion.payload.id && 
          item.talla === accion.payload.talla && 
          item.color === accion.payload.color
            ? { ...item, cantidad: Math.min(item.cantidad + 1, item.stock) }
            : item
        )
      } else {
        nuevosItems = [...estado.items, { ...accion.payload, cantidad: 1 }]
      }

      const nuevoTotal = nuevosItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      const nuevaCantidadTotal = nuevosItems.reduce((sum, item) => sum + item.cantidad, 0)

      return {
        ...estado,
        items: nuevosItems,
        total: nuevoTotal,
        cantidadTotal: nuevaCantidadTotal
      }
    }

    case 'REMOVER_ITEM': {
      const nuevosItems = estado.items.filter(
        item => !(item.id === accion.payload.id && 
                 item.talla === accion.payload.talla && 
                 item.color === accion.payload.color)
      )

      const nuevoTotal = nuevosItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      const nuevaCantidadTotal = nuevosItems.reduce((sum, item) => sum + item.cantidad, 0)

      return {
        ...estado,
        items: nuevosItems,
        total: nuevoTotal,
        cantidadTotal: nuevaCantidadTotal
      }
    }

    case 'ACTUALIZAR_CANTIDAD': {
      const nuevosItems = estado.items.map(item =>
        item.id === accion.payload.id && 
        item.talla === accion.payload.talla && 
        item.color === accion.payload.color
          ? { ...item, cantidad: Math.max(0, Math.min(accion.payload.cantidad, item.stock)) }
          : item
      ).filter(item => item.cantidad > 0)

      const nuevoTotal = nuevosItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      const nuevaCantidadTotal = nuevosItems.reduce((sum, item) => sum + item.cantidad, 0)

      return {
        ...estado,
        items: nuevosItems,
        total: nuevoTotal,
        cantidadTotal: nuevaCantidadTotal
      }
    }

    case 'LIMPIAR_CARRITO':
      return {
        ...estado,
        items: [],
        total: 0,
        cantidadTotal: 0
      }

    case 'TOGGLE_CARRITO':
      return {
        ...estado,
        mostrarCarrito: !estado.mostrarCarrito
      }

    case 'CARGAR_CARRITO': {
      const nuevoTotal = accion.payload.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
      const nuevaCantidadTotal = accion.payload.reduce((sum, item) => sum + item.cantidad, 0)

      return {
        ...estado,
        items: accion.payload,
        total: nuevoTotal,
        cantidadTotal: nuevaCantidadTotal
      }
    }

    default:
      return estado
  }
}

const CarritoContext = createContext<{
  estado: EstadoCarrito
  agregarItem: (item: Omit<ProductoCarrito, 'cantidad'>) => void
  removerItem: (id: number, talla: string, color: string) => void
  actualizarCantidad: (id: number, talla: string, color: string, cantidad: number) => void
  limpiarCarrito: () => void
  toggleCarrito: () => void
} | null>(null)

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const [estado, dispatch] = useReducer(carritoReducer, estadoInicial)

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const carritoGuardado = localStorage.getItem('sueno-mio-carrito')
    if (carritoGuardado) {
      try {
        const items = JSON.parse(carritoGuardado)
        dispatch({ type: 'CARGAR_CARRITO', payload: items })
      } catch (error) {
        console.error('Error al cargar carrito:', error)
      }
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('sueno-mio-carrito', JSON.stringify(estado.items))
  }, [estado.items])

  const agregarItem = (item: Omit<ProductoCarrito, 'cantidad'>) => {
    dispatch({ type: 'AGREGAR_ITEM', payload: item })
  }

  const removerItem = (id: number, talla: string, color: string) => {
    dispatch({ type: 'REMOVER_ITEM', payload: { id, talla, color } })
  }

  const actualizarCantidad = (id: number, talla: string, color: string, cantidad: number) => {
    dispatch({ type: 'ACTUALIZAR_CANTIDAD', payload: { id, talla, color, cantidad } })
  }

  const limpiarCarrito = () => {
    dispatch({ type: 'LIMPIAR_CARRITO' })
  }

  const toggleCarrito = () => {
    dispatch({ type: 'TOGGLE_CARRITO' })
  }

  return (
    <CarritoContext.Provider value={{
      estado,
      agregarItem,
      removerItem,
      actualizarCantidad,
      limpiarCarrito,
      toggleCarrito
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const context = useContext(CarritoContext)
  if (!context) {
    throw new Error('useCarrito debe usarse dentro de CarritoProvider')
  }
  return context
}
