'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Heart, ShoppingCart, Search, Filter } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCarrito } from '@/contexts/CarritoContext'
import { useMoneda } from '@/contexts/MonedaContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Producto, Categoria } from '@/types'
import Header from '@/components/Header'

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('nombre')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [selectedColors, setSelectedColors] = useState<Record<number, string>>({})

  const { items: wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { agregarItem } = useCarrito()
  const { getSimboloMoneda, getPrecioProducto } = useMoneda()
  const { estado } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchProductos()
    fetchCategorias()
  }, [])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/productos?incluir_categoria=true')
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setProductos(data.data)
        }
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategorias = async () => {
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

  const handleWishlistToggle = (producto: Producto) => {
    if (!estado.usuario) {
      router.push(`/login?returnUrl=/productos`)
      return
    }

    if (isInWishlist(producto.id)) {
      removeFromWishlist(producto.id)
      toast({
        title: "Producto removido",
        description: `${producto.nombre} se removió de tu wishlist`,
        duration: 2000,
      })
    } else {
      addToWishlist({
        id: producto.id,
        nombre: producto.nombre,
        precio: getPrecioProducto(producto),
        imagen_principal: producto.imagen_principal || producto.imagen_url || '/placeholder.jpg',
        categoria: producto.categoria_nombre || 'Sin categoría'
      })
      toast({
        title: "Producto agregado",
        description: `${producto.nombre} se agregó a tu wishlist`,
        duration: 2000,
      })
    }
  }

  const handleAddToCart = (producto: Producto) => {
    // Si el producto tiene variantes (tallas/colores), ir a la página del producto
    if (producto.variantes && producto.variantes.length > 0) {
      toast({
        title: "Selecciona una variante",
        description: "Este producto tiene diferentes tallas y colores. Ve a la página del producto para seleccionar.",
        duration: 3000,
      })
      router.push(`/productos/${producto.id}`)
      return
    }

    // Si no tiene variantes, agregar directamente con valores por defecto
    agregarItem({
      id: producto.id,
      nombre: producto.nombre,
      precio: getPrecioProducto(producto),
      imagen: producto.imagen_principal || producto.imagen_url || '/placeholder.jpg',
      talla: 'Única',
      color: 'Default',
      stock: producto.stock
    })

    toast({
      title: "Producto agregado",
      description: `${producto.nombre} se ha agregado al carrito`,
      duration: 2000,
    })
  }

  const handleBuyNow = (producto: Producto) => {
    if (!estado.usuario) {
      router.push(`/login?returnUrl=/productos/${producto.id}&action=buy`)
      return
    }
    
    // Si tiene variantes, ir a la página del producto
    if (producto.variantes && producto.variantes.length > 0) {
      router.push(`/productos/${producto.id}`)
      return
    }

    handleAddToCart(producto)
    router.push('/checkout')
  }

  // Función para cambiar color seleccionado
  const handleColorChange = (productoId: number, color: string) => {
    setSelectedColors(prev => ({
      ...prev,
      [productoId]: color
    }))
  }

  // Función para obtener la imagen según el color seleccionado
  const getImagenPorColor = (producto: Producto) => {
    const colorSeleccionado = selectedColors[producto.id]
    
    if (colorSeleccionado && producto.imagenes_por_color?.[colorSeleccionado]) {
      return producto.imagenes_por_color[colorSeleccionado]
    }
    
    return producto.imagen_principal || producto.imagen_url || '/placeholder.jpg'
  }

  // Función para obtener colores disponibles de un producto
  const getColoresDisponibles = (producto: Producto) => {
    if (producto.imagenes_por_color) {
      return Object.keys(producto.imagenes_por_color)
    }
    return []
  }

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(productos) || productos.length === 0) {
      return []
    }

    return productos.filter(producto => {
      if (!producto) return false
      
      const matchesSearch = (producto.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (producto.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === 'all' || producto.categoria_id?.toString() === selectedCategory
      
      const matchesPrice = priceRange === 'all' || (() => {
        const price = getPrecioProducto(producto)
        switch (priceRange) {
          case 'under50': return price < 50
          case '50-100': return price >= 50 && price <= 100
          case '100-200': return price >= 100 && price <= 200
          case 'over200': return price > 200
          default: return true
        }
      })()
      
      return matchesSearch && matchesCategory && matchesPrice
    })
  }, [productos, searchTerm, selectedCategory, priceRange, getPrecioProducto])

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'precio-asc':
        return getPrecioProducto(a) - getPrecioProducto(b)
      case 'precio-desc':
        return getPrecioProducto(b) - getPrecioProducto(a)
      case 'nombre':
        return a.nombre.localeCompare(b.nombre)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      default:
        return 0
    }
  })

  // Paginación
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header categorias={categorias} />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-stone-200 rounded-md"></div>
                <div className="p-4">
                  <div className="h-4 bg-stone-200 rounded mb-2"></div>
                  <div className="h-4 bg-stone-200 rounded w-2/3 mb-2"></div>
                  <div className="h-6 bg-stone-200 rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar de filtros - Izquierda */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-8">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-stone-900 mb-6">Filtros</h2>
                
                {/* Búsqueda */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Categorías */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    CATEGORÍA
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="cat-all" 
                        checked={selectedCategory === 'all'}
                        onCheckedChange={() => setSelectedCategory('all')}
                      />
                      <label htmlFor="cat-all" className="text-sm text-stone-600">
                        Todas las categorías
                      </label>
                    </div>
                    {categorias.map(categoria => (
                      <div key={categoria.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`cat-${categoria.id}`}
                          checked={selectedCategory === categoria.id.toString()}
                          onCheckedChange={() => setSelectedCategory(categoria.id.toString())}
                        />
                        <label htmlFor={`cat-${categoria.id}`} className="text-sm text-stone-600">
                          {categoria.nombre}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Colores */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    COLOR
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige', 'Rosa'].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 border-stone-200 ${
                          color === 'Negro' ? 'bg-black' :
                          color === 'Blanco' ? 'bg-white' :
                          color === 'Gris' ? 'bg-gray-400' :
                          color === 'Azul' ? 'bg-blue-500' :
                          color === 'Rojo' ? 'bg-red-500' :
                          color === 'Verde' ? 'bg-green-500' :
                          color === 'Beige' ? 'bg-amber-200' :
                          'bg-pink-400'
                        }`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Tallas */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    TALLA
                  </label>
                  <div className="space-y-2">
                    {['S', 'M', 'L', 'XL'].map(talla => (
                      <div key={talla} className="flex items-center space-x-2">
                        <Checkbox id={`talla-${talla}`} />
                        <label htmlFor={`talla-${talla}`} className="text-sm text-stone-600">
                          {talla}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precio */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    PRECIO
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'Todos los precios' },
                      { value: 'under50', label: `Menos de ${getSimboloMoneda()}50` },
                      { value: '50-100', label: `${getSimboloMoneda()}50 - ${getSimboloMoneda()}100` },
                      { value: '100-200', label: `${getSimboloMoneda()}100 - ${getSimboloMoneda()}200` },
                      { value: 'over200', label: `Más de ${getSimboloMoneda()}200` }
                    ].map(precio => (
                      <div key={precio.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`precio-${precio.value}`}
                          checked={priceRange === precio.value}
                          onCheckedChange={() => setPriceRange(precio.value)}
                        />
                        <label htmlFor={`precio-${precio.value}`} className="text-sm text-stone-600">
                          {precio.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disponibilidad */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-stone-700 mb-3">
                    DISPONIBILIDAD
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="en-stock" />
                      <label htmlFor="en-stock" className="text-sm text-stone-600">
                        En existencia
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="agotado" />
                      <label htmlFor="agotado" className="text-sm text-stone-600">
                        Agotado
                      </label>
                    </div>
                  </div>
                </div>

                {/* Botón limpiar filtros */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                    setPriceRange('all')
                    setSortBy('nombre')
                  }}
                >
                  Limpiar filtros
                </Button>
              </Card>
            </div>
          </div>

          {/* Contenido principal - Derecha */}
          <div className="flex-1">
            {/* Header con título y ordenamiento */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-light text-stone-900">Todo Hombre</h1>
                <p className="text-stone-600 mt-1">
                  {filteredProducts.length} productos
                </p>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="precio-asc">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="precio-desc">Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="rating">Mejor valorados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grid de productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProducts.map(producto => (
                <Card key={producto.id} className="group hover:shadow-lg transition-shadow duration-300 border-0 shadow-sm">
                  <div className="relative">
                    <div 
                      className="relative h-80 bg-stone-100 rounded-t-lg overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/productos/${producto.id}`)}
                    >
                      <img
                        src={getImagenPorColor(producto)}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {producto.en_oferta && (
                        <Badge className="absolute top-3 left-3 bg-black text-white text-xs">
                          Oferta
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-3 right-3 h-8 w-8 p-0 bg-white hover:bg-stone-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleWishlistToggle(producto)
                        }}
                      >
                        <Heart 
                          className={`h-4 w-4 ${isInWishlist(producto.id) ? 'fill-red-500 text-red-500' : 'text-stone-600'}`}
                        />
                      </Button>
                    </div>

                    <CardContent className="p-4">
                      <h3 
                        className="font-normal text-stone-900 mb-2 cursor-pointer hover:text-stone-700 text-sm"
                        onClick={() => router.push(`/productos/${producto.id}`)}
                      >
                        {producto.nombre}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-stone-900">
                            {getSimboloMoneda()}{getPrecioProducto(producto).toFixed(2)}
                          </span>
                          {producto.precio_anterior && (
                            <span className="text-sm text-stone-500 line-through">
                              {getSimboloMoneda()}{producto.precio_anterior.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selector de colores en el catálogo */}
                      {getColoresDisponibles(producto).length > 0 && (
                        <div className="mb-3">
                          <div className="flex space-x-1">
                            {getColoresDisponibles(producto).slice(0, 4).map(color => (
                              <button
                                key={color}
                                className={`w-4 h-4 rounded-full border ${
                                  selectedColors[producto.id] === color 
                                    ? 'border-stone-900 border-2' 
                                    : 'border-stone-300'
                                } ${
                                  color === 'Negro' ? 'bg-black' :
                                  color === 'Blanco' ? 'bg-white' :
                                  color === 'Gris' ? 'bg-gray-400' :
                                  color === 'Azul' ? 'bg-blue-500' :
                                  color === 'Rojo' ? 'bg-red-500' :
                                  color === 'Verde' ? 'bg-green-500' :
                                  color === 'Beige' ? 'bg-amber-200' :
                                  'bg-pink-400'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleColorChange(producto.id, color)
                                }}
                                title={color}
                              />
                            ))}
                            {getColoresDisponibles(producto).length > 4 && (
                              <span className="text-xs text-stone-500 ml-2">
                                +{getColoresDisponibles(producto).length - 4} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {producto.stock < 10 && producto.stock > 0 && (
                        <p className="text-xs text-orange-600 mb-2">
                          ¡Solo quedan {producto.stock} unidades!
                        </p>
                      )}

                      {producto.stock === 0 && (
                        <p className="text-xs text-red-600 mb-2">
                          Agotado
                        </p>
                      )}

                      {/* Botones de acción */}
                      <div className="flex space-x-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleAddToCart(producto)}
                          disabled={producto.stock === 0}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Agregar
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-stone-900 hover:bg-stone-800 text-xs"
                          onClick={() => handleBuyNow(producto)}
                          disabled={producto.stock === 0}
                        >
                          Comprar
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            )}

            {/* Sin resultados */}
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-stone-400 mb-4">
                  <Filter className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-stone-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-stone-600 mb-4">
                  Intenta ajustar tus filtros de búsqueda
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                    setPriceRange('all')
                    setSortBy('nombre')
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
