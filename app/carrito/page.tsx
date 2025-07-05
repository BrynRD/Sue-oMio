'use client'

import { Button } from "@/components/ui/button"
import { Heart, ShoppingBag, User, Search, Menu, Minus, Plus, X, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCarrito } from "@/contexts/CarritoContext"

export default function CarritoPage() {
  const { estado, removerItem, actualizarCantidad } = useCarrito()

  const costoEnvio = estado.total >= 200 ? 0 : 15
  const totalConEnvio = estado.total + costoEnvio

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-light tracking-wide text-stone-800">
                Sueño Mío
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-12">
              <Link href="/productos" className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors tracking-wide">
                Mujer
              </Link>
              <Link href="/productos" className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors tracking-wide">
                Hombre
              </Link>
              <Link href="/productos" className="text-sm font-medium text-stone-600 hover:text-stone-800 transition-colors tracking-wide">
                Accesorios
              </Link>
              <Link href="/sale" className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors tracking-wide">
                Sale
              </Link>
            </nav>

            <div className="flex items-center space-x-6">
              <Button variant="ghost" size="sm" className="hidden md:flex text-stone-600 hover:text-stone-800">
                <Search className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-800">
                <User className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" className="relative text-stone-600 hover:text-stone-800">
                <ShoppingBag className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-stone-800 text-white text-xs flex items-center justify-center">
                  {estado.cantidadTotal}
                </span>
              </Button>
              
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link 
            href="/productos" 
            className="inline-flex items-center text-sm text-stone-600 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuar comprando
          </Link>
        </div>

        <h1 className="text-3xl font-light text-stone-800 mb-8 tracking-wide">
          Carrito de Compras
        </h1>

        {estado.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 text-stone-400" />
            </div>
            <h2 className="text-2xl font-light text-stone-800 mb-4">
              Tu carrito está vacío
            </h2>
            <p className="text-stone-600 mb-8">
              Descubre nuestra colección de prendas atemporales
            </p>
            <Link href="/productos">
              <Button className="bg-stone-800 text-white hover:bg-stone-900 px-8 py-3">
                Explorar productos
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Items del carrito */}
            <div className="lg:col-span-2 space-y-6">
              {estado.items.map((item) => (
                <div 
                  key={`${item.id}-${item.talla}-${item.color}`} 
                  className="bg-white p-6 rounded-sm border border-stone-200"
                >
                  <div className="flex gap-6">
                    {/* Imagen */}
                    <div className="w-24 h-32 bg-stone-100 rounded-sm overflow-hidden flex-shrink-0">
                      <Image
                        src={item.imagen}
                        alt={item.nombre}
                        width={96}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Detalles */}
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-stone-800 mb-2">
                            {item.nombre}
                          </h3>
                          
                          <div className="space-y-1 text-sm text-stone-600">
                            <div>Talla: {item.talla}</div>
                            <div className="flex items-center gap-2">
                              Color: 
                              <div 
                                className="w-4 h-4 rounded-full border border-stone-300"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="capitalize">{item.color}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removerItem(item.id, item.talla, item.color)}
                          className="text-stone-400 hover:text-stone-600 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Control de cantidad */}
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-stone-600">Cantidad:</span>
                          <div className="flex items-center border border-stone-300 rounded">
                            <button
                              onClick={() => actualizarCantidad(item.id, item.talla, item.color, item.cantidad - 1)}
                              className="p-2 hover:bg-stone-50 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => actualizarCantidad(item.id, item.talla, item.color, item.cantidad + 1)}
                              className="p-2 hover:bg-stone-50 transition-colors"
                              disabled={item.cantidad >= item.stock}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {item.cantidad >= item.stock && (
                            <span className="text-xs text-red-600">Stock máximo</span>
                          )}
                        </div>

                        {/* Precio */}
                        <div className="text-right">
                          <div className="text-lg font-medium text-stone-800">
                            S/ {(item.precio * item.cantidad).toFixed(2)}
                          </div>
                          {item.cantidad > 1 && (
                            <div className="text-sm text-stone-500">
                              S/ {item.precio.toFixed(2)} cada uno
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Botón para agregar más productos */}
              <div className="text-center pt-6">
                <Link href="/productos">
                  <Button 
                    variant="outline" 
                    className="border-stone-300 text-stone-700 hover:bg-stone-50"
                  >
                    Agregar más productos
                  </Button>
                </Link>
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-sm border border-stone-200 sticky top-24">
                <h2 className="text-lg font-medium text-stone-800 mb-6">
                  Resumen del pedido
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">
                      Subtotal ({estado.cantidadTotal} {estado.cantidadTotal === 1 ? 'artículo' : 'artículos'})
                    </span>
                    <span className="font-medium">S/ {estado.total.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Envío</span>
                    <span className="font-medium">
                      {costoEnvio === 0 ? (
                        <span className="text-green-600">GRATIS</span>
                      ) : (
                        `S/ ${costoEnvio.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  {estado.total < 200 && (
                    <div className="text-xs text-stone-500 bg-stone-50 p-3 rounded">
                      Agrega S/ {(200 - estado.total).toFixed(2)} más para envío gratuito
                    </div>
                  )}

                  <hr className="border-stone-200" />

                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-stone-800">Total</span>
                    <span className="text-lg font-medium text-stone-800">
                      S/ {totalConEnvio.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/checkout">
                    <Button className="w-full bg-stone-800 text-white hover:bg-stone-900 py-3">
                      Finalizar compra
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-stone-300 text-stone-700 hover:bg-stone-50"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Guardar para después
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-stone-200 space-y-3 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Devoluciones gratuitas en 30 días</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Cambios de talla sin costo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Atención al cliente 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
