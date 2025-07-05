'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCarrito } from '@/contexts/CarritoContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { useMoneda } from '@/contexts/MonedaContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Minus, 
  Plus, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import { Producto, VarianteProducto } from '@/types'

export default function ProductoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imagenSeleccionada, setImagenSeleccionada] = useState(0)
  const [tallaSeleccionada, setTallaSeleccionada] = useState('')
  const [colorSeleccionado, setColorSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState(1)

  const { agregarItem } = useCarrito()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { estado: authState } = useAuth()
  const { getSimboloMoneda, getPrecioProducto } = useMoneda()

  const productId = params.id as string

  useEffect(() => {
    if (productId) {
      fetchProducto()
    }
    cargarCategorias()
  }, [productId])

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

  const fetchProducto = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/productos/${productId}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const prod = result.data
          setProducto(prod)
          
          // Establecer valores por defecto
          if (prod.tallas && prod.tallas.length > 0) {
            setTallaSeleccionada(prod.tallas[0])
          }
          if (prod.colores && prod.colores.length > 0) {
            setColorSeleccionado(prod.colores[0])
          }
        } else {
          setError('Producto no encontrado')
        }
      } else {
        setError('Error al cargar el producto')
      }
    } catch (error) {
      console.error('Error fetching producto:', error)
      setError('Error al cargar el producto')
    } finally {
      setLoading(false)
    }
  }

  // Obtener la variante seleccionada y actualizar imagen cuando cambia el color
  const varianteSeleccionada = producto?.variantes?.find(
    (v: any) => v.color === colorSeleccionado && v.talla === tallaSeleccionada
  )

  // Obtener stock disponible para la variante seleccionada
  const stockDisponible = varianteSeleccionada?.stock || 0

  // Actualizar imagen cuando cambia el color
  useEffect(() => {
    if (producto?.imagenes_por_color?.[colorSeleccionado]) {
      setImagenSeleccionada(0) // Reset to first image when color changes
    }
  }, [colorSeleccionado, producto?.imagenes_por_color])

  // Obtener tallas disponibles para el color seleccionado
  const tallasDisponibles = producto?.variantes
    ?.filter((v: any) => v.color === colorSeleccionado && v.activo && v.stock > 0)
    ?.map((v: any) => v.talla)
    ?.filter((talla, index, arr) => arr.indexOf(talla) === index) || []

  // Obtener colores disponibles
  const coloresDisponibles = producto?.variantes
    ?.filter((v: any) => v.activo && v.stock > 0)
    ?.map((v: any) => v.color)
    ?.filter((color, index, arr) => arr.indexOf(color) === index) || []

  const manejarAgregarCarrito = () => {
    if (!producto) return
    
    // Validar que hay stock disponible
    if (stockDisponible === 0) {
      toast({
        title: "Sin stock",
        description: "Esta combinación de talla y color no está disponible",
        variant: "destructive",
      })
      return
    }

    // Validar que se han seleccionado talla y color
    if (!tallaSeleccionada || !colorSeleccionado) {
      toast({
        title: "Selección incompleta",
        description: "Por favor selecciona una talla y color",
        variant: "destructive",
      })
      return
    }
    
    agregarItem({
      id: producto.id,
      nombre: producto.nombre,
      precio: getPrecioProducto(producto),
      imagen: producto.imagenes_por_color?.[colorSeleccionado] || producto.imagen_principal || '/placeholder.jpg',
      talla: tallaSeleccionada,
      color: colorSeleccionado,
      stock: stockDisponible
    })
    
    toast({
      title: "¡Producto agregado!",
      description: `${producto.nombre} (${colorSeleccionado}, ${tallaSeleccionada}) se agregó al carrito`,
    })
    
    toast({
      title: "¡Agregado al carrito!",
      description: `${producto.nombre} se ha agregado a tu carrito`,
    })
  }

  const manejarComprarAhora = () => {
    if (!authState.usuario) {
      router.push(`/login?returnUrl=/productos/${productId}&action=buy`)
      return
    }
    
    manejarAgregarCarrito()
    router.push('/checkout')
  }

  const manejarWishlist = () => {
    if (!producto) return
    
    if (isInWishlist(producto.id)) {
      removeFromWishlist(producto.id)
      toast({
        title: "Eliminado de favoritos",
        description: `${producto.nombre} se ha eliminado de tus favoritos`,
      })
    } else {
      addToWishlist({
        id: producto.id,
        nombre: producto.nombre,
        precio: getPrecioProducto(producto),
        imagen_principal: producto.imagen_url || '/placeholder.jpg',
        categoria: producto.categoria_nombre || 'Sin categoría'
      })
      toast({
        title: "Agregado a favoritos",
        description: `${producto.nombre} se ha agregado a tus favoritos`,
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header categorias={categorias} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="aspect-square bg-stone-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-stone-200 rounded animate-pulse"></div>
                <div className="h-4 bg-stone-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-6 bg-stone-200 rounded w-1/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !producto) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header categorias={categorias} />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-stone-400 mx-auto mb-4" />
            <h1 className="text-2xl font-light text-stone-800 mb-2">
              {error || 'Producto no encontrado'}
            </h1>
            <p className="text-stone-600 mb-6">
              El producto que buscas no existe o no está disponible.
            </p>
            <Button asChild>
              <Link href="/productos">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al catálogo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const imagenes = (() => {
    // Si hay imagen específica para el color seleccionado, usarla
    if (colorSeleccionado && producto?.imagenes_por_color?.[colorSeleccionado]) {
      return [producto.imagenes_por_color[colorSeleccionado]]
    }
    // Sino, usar imagen principal y otras imágenes del producto
    return [producto?.imagen_principal || producto?.imagen_url, ...(producto?.imagenes || [])].filter(Boolean)
  })()
  const enWishlist = isInWishlist(producto.id)
  const precioActual = getPrecioProducto(producto, producto.en_oferta)
  const precioOriginal = producto.en_oferta ? getPrecioProducto(producto, false) : null

  return (
    <div className="min-h-screen bg-white">
      <Header categorias={categorias} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <div className="flex items-center space-x-2 text-sm text-neutral-600">
              <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
              <span>/</span>
              <Link href="/productos" className="hover:text-neutral-900 transition-colors">Products</Link>
              <span>/</span>
              <span className="text-neutral-900">{producto.nombre}</span>
            </div>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Galería de imágenes */}
            <div className="space-y-6">
              <div className="aspect-[4/5] bg-neutral-100 overflow-hidden">
                <Image
                  src={imagenes[imagenSeleccionada] || '/placeholder.jpg'}
                  alt={producto.nombre}
                  width={600}
                  height={750}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              
              {imagenes.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {imagenes.map((imagen, index) => (
                    <button
                      key={index}
                      onClick={() => setImagenSeleccionada(index)}
                      className={`aspect-square overflow-hidden transition-all ${
                        imagenSeleccionada === index 
                          ? 'opacity-100' 
                          : 'opacity-60 hover:opacity-80'
                      }`}
                    >
                      <Image
                        src={imagen || '/placeholder.jpg'}
                        alt={`${producto.nombre} ${index + 1}`}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Información del producto */}
            <div className="space-y-8">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-light text-neutral-900 mb-2 leading-tight">
                      {producto.nombre}
                    </h1>
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-2xl font-light text-neutral-900">
                        {getSimboloMoneda()} {precioActual.toFixed(2)}
                      </span>
                      {producto.en_oferta && precioOriginal && (
                        <span className="text-lg text-neutral-500 line-through">
                          {getSimboloMoneda()} {precioOriginal.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={manejarWishlist}
                    className="p-3 hover:bg-neutral-100"
                  >
                    <Heart className={`h-5 w-5 ${enWishlist ? 'fill-neutral-900 text-neutral-900' : 'text-neutral-600'}`} />
                  </Button>
                </div>

                {/* Disponibilidad */}
                <div className="mb-6">
                  {producto.stock > 0 ? (
                    <p className="text-sm text-green-700">In Stock</p>
                  ) : (
                    <p className="text-sm text-red-600">Out of Stock</p>
                  )}
                </div>
              </div>

              <Separator className="bg-neutral-200" />

              {/* Selección de variantes */}
              <div className="space-y-6">
                {/* Colores */}
                {coloresDisponibles && coloresDisponibles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-3 uppercase tracking-wide">
                      Color: {colorSeleccionado || 'Selecciona un color'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {coloresDisponibles.map((color: string) => (
                        <button
                          key={color}
                          onClick={() => {
                            setColorSeleccionado(color)
                            setTallaSeleccionada('') // Reset talla when changing color
                            toast({
                              title: "Color seleccionado",
                              description: `Has seleccionado el color ${color}`,
                            })
                          }}
                          className={`px-4 py-2 text-sm border transition-all relative ${
                            colorSeleccionado === color
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg'
                              : 'border-neutral-300 text-neutral-700 hover:border-neutral-500 hover:shadow-md'
                          }`}
                        >
                          {color}
                          {colorSeleccionado === color && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tallas */}
                {tallasDisponibles && tallasDisponibles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-3 uppercase tracking-wide">
                      Size: {tallaSeleccionada || 'Selecciona una talla'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {producto.tallas?.map((talla: string) => {
                        const isAvailable = tallasDisponibles.includes(talla)
                        const varianteStock = producto?.variantes?.find(
                          (v: any) => v.color === colorSeleccionado && v.talla === talla
                        )?.stock || 0
                        
                        return (
                          <button
                            key={talla}
                            onClick={() => {
                              if (isAvailable) {
                                setTallaSeleccionada(talla)
                                toast({
                                  title: "Talla seleccionada",
                                  description: `Talla ${talla} seleccionada. Stock disponible: ${varianteStock}`,
                                })
                              }
                            }}
                            disabled={!isAvailable}
                            className={`w-12 h-12 text-sm border transition-all relative ${
                              tallaSeleccionada === talla
                                ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg'
                                : isAvailable
                                ? 'border-neutral-300 text-neutral-700 hover:border-neutral-500 hover:shadow-md'
                                : 'border-neutral-200 text-neutral-400 cursor-not-allowed bg-neutral-50'
                            }`}
                          >
                            {talla}
                            {tallaSeleccionada === talla && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                            {!isAvailable && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-neutral-400 transform rotate-45"></div>
                              </div>
                            )}
                          </button>
                        )
                      }) || []}
                    </div>
                    {colorSeleccionado && tallasDisponibles.length === 0 && (
                      <p className="text-sm text-red-600 mt-2">
                        No hay tallas disponibles para el color seleccionado
                      </p>
                    )}
                    {!colorSeleccionado && (
                      <p className="text-sm text-neutral-500 mt-2">
                        Selecciona un color para ver las tallas disponibles
                      </p>
                    )}
                  </div>
                )}

                {/* Cantidad */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-900 mb-3 uppercase tracking-wide">
                    Quantity
                  </h3>
                  {stockDisponible > 0 && (
                    <p className="text-sm text-green-700 mb-3">
                      {stockDisponible} {stockDisponible === 1 ? 'unidad disponible' : 'unidades disponibles'}
                    </p>
                  )}
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      disabled={cantidad <= 1}
                      className="h-10 w-10 p-0 border-neutral-300 hover:border-neutral-500"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-light text-lg">{cantidad}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCantidad(Math.min(stockDisponible, cantidad + 1))}
                      disabled={cantidad >= stockDisponible || stockDisponible === 0}
                      className="h-10 w-10 p-0 border-neutral-300 hover:border-neutral-500"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="bg-neutral-200" />

              {/* Botones de acción */}
              <div className="space-y-4">
                <Button
                  onClick={manejarAgregarCarrito}
                  disabled={stockDisponible === 0 || !tallaSeleccionada || !colorSeleccionado}
                  className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 text-white font-light text-sm uppercase tracking-wide disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  {stockDisponible === 0 
                    ? 'Sin stock' 
                    : !colorSeleccionado || !tallaSeleccionada
                    ? 'Selecciona color y talla'
                    : 'Add to Cart'
                  }
                </Button>
                
                <Button
                  onClick={manejarComprarAhora}
                  disabled={stockDisponible === 0 || !tallaSeleccionada || !colorSeleccionado}
                  variant="outline"
                  className="w-full h-12 border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white font-light text-sm uppercase tracking-wide disabled:border-neutral-300 disabled:text-neutral-300 disabled:cursor-not-allowed"
                >
                  {stockDisponible === 0 
                    ? 'Sin stock' 
                    : !colorSeleccionado || !tallaSeleccionada
                    ? 'Selecciona color y talla'
                    : 'Buy Now'
                  }
                </Button>
              </div>

              <Separator className="bg-neutral-200" />

              {/* Descripción */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-neutral-900 uppercase tracking-wide">Details</h3>
                <div className="prose prose-sm text-neutral-700 leading-relaxed">
                  <p className="whitespace-pre-line">{producto.descripcion}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}