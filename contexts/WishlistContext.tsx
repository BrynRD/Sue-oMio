'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface WishlistItem {
  id: number
  nombre: string
  precio: number
  precio_oferta?: number
  imagen_principal: string
  categoria: string
  fecha_agregado: string
}

interface WishlistContextType {
  items: WishlistItem[]
  addToWishlist: (product: Omit<WishlistItem, 'fecha_agregado'>) => void
  removeFromWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  clearWishlist: () => void
  toggleWishlist: (product: Omit<WishlistItem, 'fecha_agregado'>) => void
  itemCount: number
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

interface WishlistProviderProps {
  children: ReactNode
}

const STORAGE_KEY = 'sueno-mio-wishlist'

export function WishlistProvider({ children }: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar wishlist desde localStorage al inicializar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsedItems = JSON.parse(saved)
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems)
          }
        }
      } catch (error) {
        console.error('Error al cargar wishlist desde localStorage:', error)
      }
      setIsInitialized(true)
    }
  }, [])

  // Guardar wishlist en localStorage cuando cambie
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      } catch (error) {
        console.error('Error al guardar wishlist en localStorage:', error)
      }
    }
  }, [items, isInitialized])

  const addToWishlist = (product: Omit<WishlistItem, 'fecha_agregado'>) => {
    setItems(prevItems => {
      // Verificar si el producto ya está en la wishlist
      if (prevItems.some(item => item.id === product.id)) {
        return prevItems
      }

      const newItem: WishlistItem = {
        ...product,
        fecha_agregado: new Date().toISOString()
      }

      return [...prevItems, newItem]
    })
  }

  const removeFromWishlist = (productId: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId))
  }

  const isInWishlist = (productId: number): boolean => {
    return items.some(item => item.id === productId)
  }

  const clearWishlist = () => {
    setItems([])
  }

  const toggleWishlist = (product: Omit<WishlistItem, 'fecha_agregado'>) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const itemCount = items.length

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        toggleWishlist,
        itemCount
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist debe usarse dentro de WishlistProvider')
  }
  return context
}
