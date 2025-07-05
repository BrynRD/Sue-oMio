'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Heart, 
  ShoppingBag, 
  Trash2, 
  Star,
  Calendar,
  ArrowRight,
  HeartOff
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCarrito } from '@/contexts/CarritoContext'
import Header from '@/components/Header'

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist, itemCount } = useWishlist()
  const { agregarItem } = useCarrito()
  const [categorias, setCategorias] = useState([])

  useEffect(() => {
    cargarCategorias()
  }, [])

  const cargarCategorias = async () => {
    try {
      const response = await fetch('/api/categorias')
      if (response.ok) {
        const data = await response.json()
        setCategorias(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    }
  }

  const agregarAlCarrito = (item: any) => {
    agregarItem({
      id: item.id,
      nombre: item.nombre,
      precio: item.precio_oferta || item.precio,
      precio_original: item.precio,
      imagen: item.imagen_principal,
      cantidad: 1,
      talla: 'M', // Talla por defecto
      color: 'Default'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(price).replace('PEN', 'S/')
  }

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header categorias={categorias} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mb-6">
              <HeartOff className="h-12 w-12 text-stone-400" />
            </div>
            <h1 className="text-3xl font-light text-stone-800 mb-4">Tu lista de deseos está vacía</h1>
            <p className="text-stone-600 mb-8 max-w-md mx-auto">
              Guarda tus productos favoritos aquí para encontrarlos fácilmente más tarde.
            </p>
            <Link href="/productos">
              <Button className="bg-stone-800 text-white hover:bg-stone-700">
                Explorar Productos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-stone-800 mb-2">Mi Lista de Deseos</h1>
            <p className="text-stone-600">
              {itemCount} {itemCount === 1 ? 'producto guardado' : 'productos guardados'}
            </p>
          </div>
          
          {itemCount > 0 && (
            <Button
              onClick={clearWishlist}
              variant="outline"
              className="text-stone-600 border-stone-300 hover:bg-stone-100"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar Lista
            </Button>
          )}
        </div>

        {/* Lista de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-stone-200 hover:shadow-lg transition-shadow duration-300">
              <div className="relative">
                <Link href={`/productos/${item.id}`}>
                  <div className="aspect-[4/5] relative overflow-hidden bg-stone-100">
                    <Image
                      src={item.imagen_principal || '/placeholder.svg'}
                      alt={item.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </Link>
                
                {/* Botón de eliminar */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-stone-600 hover:text-red-500 hover:bg-white transition-all duration-200 shadow-md"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>

                {/* Badge de oferta */}
                {item.precio_oferta && item.precio_oferta < item.precio && (
                  <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                    -{Math.round(((item.precio - item.precio_oferta) / item.precio) * 100)}%
                  </Badge>
                )}
              </div>

              <CardContent className="p-6">
                <div className="mb-4">
                  <Badge variant="secondary" className="text-xs mb-2">
                    {item.categoria}
                  </Badge>
                  
                  <Link href={`/productos/${item.id}`}>
                    <h3 className="font-medium text-stone-800 hover:text-stone-600 transition-colors">
                      {item.nombre}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {item.precio_oferta && item.precio_oferta < item.precio ? (
                      <>
                        <span className="text-lg font-light text-stone-800">
                          {formatPrice(item.precio_oferta)}
                        </span>
                        <span className="text-sm text-stone-500 line-through">
                          {formatPrice(item.precio)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-light text-stone-800">
                        {formatPrice(item.precio)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-xs text-stone-500">
                  <Calendar className="h-3 w-3" />
                  <span>Agregado el {formatDate(item.fecha_agregado)}</span>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => agregarAlCarrito(item)}
                    className="w-full bg-stone-800 text-white hover:bg-stone-700"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Agregar al Carrito
                  </Button>
                  
                  <Link href={`/productos/${item.id}`} className="block">
                    <Button variant="outline" className="w-full">
                      Ver Detalles
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sugerencias */}
        <div className="mt-12">
          <Alert>
            <Star className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Los productos en tu lista de deseos pueden cambiar de precio. 
              Te recomendamos revisarla regularmente para no perder las mejores ofertas.
            </AlertDescription>
          </Alert>
        </div>

        {/* Acciones adicionales */}
        <div className="mt-8 text-center">
          <Link href="/productos">
            <Button variant="outline" className="mr-4">
              Seguir Comprando
            </Button>
          </Link>
          
          {itemCount > 0 && (
            <Button
              onClick={() => {
                items.forEach(item => agregarAlCarrito(item))
              }}
              className="bg-stone-800 text-white hover:bg-stone-700"
            >
              Agregar Todo al Carrito
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
