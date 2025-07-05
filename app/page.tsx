'use client'

import { useState, useEffect } from 'react'
import { useMoneda } from '@/contexts/MonedaContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Search, ShoppingBag, User, Menu, ChevronDown, Filter, Grid, List } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/Header"

export default function HomePage() {
  const { monedaActual, getSimboloMoneda } = useMoneda()
  const [productos, setProductos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    cargarDatos()
    
    const handleFocus = () => {
      cargarDatos()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const cargarDatos = async () => {
    try {
      const timestamp = new Date().getTime()
      const [productosRes, categoriasRes] = await Promise.all([
        fetch(`/api/productos?limite=12&destacado=true&_t=${timestamp}`),
        fetch(`/api/categorias?_t=${timestamp}`)
      ])
      
      if (productosRes.ok) {
        const data = await productosRes.json()
        setProductos(data.success && Array.isArray(data.data) ? data.data : [])
      }
      
      if (categoriasRes.ok) {
        const data = await categoriasRes.json()
        setCategorias(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setCategorias([
        { id: 1, nombre: 'Mujer', descripcion: 'Ropa para mujer' },
        { id: 2, nombre: 'Hombre', descripcion: 'Ropa para hombre' },
        { id: 3, nombre: 'Accesorios', descripcion: 'Accesorios y complementos' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getPrecioProducto = (producto: any) => {
    if (!producto) return '0.00'
    
    const esOferta = producto.en_oferta
    let precio = 0
    
    switch (monedaActual) {
      case 'USD':
        precio = esOferta && producto.precio_oferta_usd ? 
          parseFloat(producto.precio_oferta_usd) : parseFloat(producto.precio_usd || '0')
        break
      case 'EUR':
        precio = esOferta && producto.precio_oferta_eur ? 
          parseFloat(producto.precio_oferta_eur) : parseFloat(producto.precio_eur || '0')
        break
      default:
        precio = esOferta && producto.precio_oferta_pen ? 
          parseFloat(producto.precio_oferta_pen) : parseFloat(producto.precio_pen || '0')
    }
    
    return precio.toFixed(2)
  }

  const getPrecioOriginal = (producto: any) => {
    if (!producto || !producto.en_oferta) return null
    
    let precio = 0
    switch (monedaActual) {
      case 'USD':
        precio = parseFloat(producto.precio_usd || '0')
        break
      case 'EUR':
        precio = parseFloat(producto.precio_eur || '0')
        break
      default:
        precio = parseFloat(producto.precio_pen || '0')
    }
    
    return precio.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />


      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-20">
            <h1 className="text-4xl md:text-6xl font-light text-stone-800 mb-6 tracking-tight">
              Moda consciente.
              <span className="block font-normal">Calidad excepcional.</span>
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Descubre prendas atemporales diseñadas para durar, 
              hechas con materiales de la más alta calidad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-stone-800 text-white hover:bg-stone-900 px-8 py-3 text-sm font-medium tracking-wide">
                Ver Colección Mujer
              </Button>
              <Button variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50 px-8 py-3 text-sm font-medium tracking-wide">
                Ver Colección Hombre
              </Button>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {categorias.slice(0, 3).map((categoria: any, index) => (
              <Link key={categoria.id} href={`/productos?categoria=${categoria.id}`} className="group">
                <div className="relative bg-white rounded-sm overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="aspect-[4/5] bg-stone-100 relative">
                    <Image
                      src={categoria.imagen ? `${categoria.imagen}?t=${Date.now()}` : "/placeholder.svg"}
                      alt={categoria.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg"
                      }}
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-medium text-stone-800 group-hover:text-stone-900">
                      {categoria.nombre}
                    </h3>
                    <p className="text-sm text-stone-600 mt-1">
                      {categoria.descripcion}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>


      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl font-light text-stone-800 mb-2 tracking-wide">
                Productos Destacados
              </h2>
              <p className="text-stone-600">
                Piezas seleccionadas para esta temporada
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-800">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-800">
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {!Array.isArray(productos) || productos.length === 0 ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="h-8 w-8 text-stone-400" />
                </div>
                <h3 className="text-xl font-medium text-stone-800 mb-4">
                  Tu tienda está lista
                </h3>
                <p className="text-stone-600 mb-6">
                  Agrega productos desde el panel de administración para comenzar a vender.
                </p>
                <Button className="bg-stone-800 text-white hover:bg-stone-900 px-6 py-2 text-sm font-medium">
                  Ir al Panel Admin
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
              {productos.map((producto: any) => (
                <div key={producto.id} className="group">
                  <div className="relative aspect-[3/4] bg-stone-100 mb-4 overflow-hidden">
                    <Image
                      src={producto.imagen_principal || "/placeholder.svg"}
                      alt={producto.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    {/* Wishlist Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-3 right-3 bg-white/80 hover:bg-white shadow-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      <Heart className="h-4 w-4 text-stone-600" />
                    </Button>
                    
                    {producto.en_oferta && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded">
                          SALE
                        </span>
                      </div>
                    )}
                    

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button className="w-full bg-white text-stone-800 hover:bg-stone-50 text-sm font-medium py-2">
                        Agregar al Carrito
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-stone-800 line-clamp-2 group-hover:text-stone-900">
                      {producto.nombre}
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-stone-800">
                        {getSimboloMoneda()} {getPrecioProducto(producto)}
                      </span>
                      {producto.en_oferta && getPrecioOriginal(producto) && (
                        <span className="text-sm text-stone-500 line-through">
                          {getSimboloMoneda()} {getPrecioOriginal(producto)}
                        </span>
                      )}
                    </div>
                    
                    {producto.colores && producto.colores.length > 0 && (
                      <div className="flex items-center space-x-1 pt-1">
                        {producto.colores.slice(0, 4).map((color: string, index: number) => (
                          <div
                            key={index}
                            className="w-3 h-3 rounded-full border border-stone-200"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                        ))}
                        {producto.colores.length > 4 && (
                          <span className="text-xs text-stone-500 ml-1">
                            +{producto.colores.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>


      <section className="bg-stone-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-light text-stone-800 mb-4 tracking-wide">
              Nuestros Valores
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Creemos en la transparencia, la calidad y la responsabilidad en cada prenda que creamos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-4">Envío Responsable</h3>
              <p className="text-stone-600 leading-relaxed">
                Envío gratuito en compras mayores a S/ 200. 
                Packaging sostenible y delivery en 2-3 días.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-4">Calidad Garantizada</h3>
              <p className="text-stone-600 leading-relaxed">
                Materiales cuidadosamente seleccionados. 
                Garantía de satisfacción en todas tus compras.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-medium text-stone-800 mb-4">Atención Personal</h3>
              <p className="text-stone-600 leading-relaxed">
                Servicio al cliente excepcional. 
                Estamos aquí para ayudarte en cada paso.
              </p>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-light text-stone-800 mb-4 tracking-wide">
            Mantente al día
          </h2>
          <p className="text-stone-600 mb-8">
            Suscríbete para recibir las últimas noticias sobre nuevas colecciones y ofertas exclusivas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu email"
              className="flex-1 px-4 py-3 border border-stone-300 focus:border-stone-500 focus:outline-none text-sm"
            />
            <Button className="bg-stone-800 text-white hover:bg-stone-900 px-8 py-3 text-sm font-medium">
              Suscribirse
            </Button>
          </div>
        </div>
      </section>


      <footer className="bg-stone-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center mb-6">
                <span className="text-2xl font-light tracking-wide text-white">
                  Sueño Mío
                </span>
              </Link>
              <p className="text-stone-300 leading-relaxed max-w-md mb-6">
                Moda consciente y atemporal para el consumidor moderno. 
                Calidad excepcional en cada prenda.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-stone-400 hover:text-white transition-colors">
                  Instagram
                </a>
                <a href="#" className="text-stone-400 hover:text-white transition-colors">
                  Facebook
                </a>
                <a href="#" className="text-stone-400 hover:text-white transition-colors">
                  Twitter
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm uppercase tracking-wider mb-6 text-stone-200">
                Categorías
              </h4>
              <ul className="space-y-3">
                {categorias.slice(0, 4).map((categoria: any) => (
                  <li key={categoria.id}>
                    <Link 
                      href={`/productos?categoria=${categoria.id}`} 
                      className="text-stone-400 hover:text-white transition-colors text-sm"
                    >
                      {categoria.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-sm uppercase tracking-wider mb-6 text-stone-200">
                Ayuda
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/contacto" className="text-stone-400 hover:text-white transition-colors text-sm">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/envios" className="text-stone-400 hover:text-white transition-colors text-sm">
                    Envíos
                  </Link>
                </li>
                <li>
                  <Link href="/devoluciones" className="text-stone-400 hover:text-white transition-colors text-sm">
                    Devoluciones
                  </Link>
                </li>
                <li>
                  <Link href="/tallas" className="text-stone-400 hover:text-white transition-colors text-sm">
                    Guía de Tallas
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-stone-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-stone-400 text-sm mb-4 md:mb-0">
                &copy; 2024 Sueño Mío. Todos los derechos reservados.
              </p>
              <div className="flex items-center space-x-6">
                <Link href="/privacidad" className="text-stone-400 hover:text-white transition-colors text-sm">
                  Privacidad
                </Link>
                <Link href="/terminos" className="text-stone-400 hover:text-white transition-colors text-sm">
                  Términos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
