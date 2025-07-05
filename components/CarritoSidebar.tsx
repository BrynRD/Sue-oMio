'use client'

import { Button } from "@/components/ui/button"
import { X, Plus, Minus, ShoppingBag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCarrito } from "@/contexts/CarritoContext"
import { useMoneda } from "@/contexts/MonedaContext"

export default function CarritoSidebar() {
  const { estado, removerItem, actualizarCantidad, toggleCarrito } = useCarrito()
  const { formatearPrecio } = useMoneda()

  if (!estado.mostrarCarrito) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={toggleCarrito}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-stone-200">
            <h2 className="text-lg font-medium text-stone-800">
              Carrito ({estado.cantidadTotal})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCarrito}
              className="text-stone-600 hover:text-stone-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {estado.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="h-8 w-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-medium text-stone-800 mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-stone-600 mb-6">
                  Agrega algunos productos para comenzar
                </p>
                <Button
                  onClick={toggleCarrito}
                  className="bg-stone-800 text-white hover:bg-stone-900"
                >
                  <Link href="/productos">Explorar productos</Link>
                </Button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {estado.items.map((item) => (
                  <div key={`${item.id}-${item.talla}-${item.color}`} className="flex gap-4">
                    {/* Imagen */}
                    <div className="w-20 h-20 bg-stone-100 rounded-sm overflow-hidden flex-shrink-0">
                      <Image
                        src={item.imagen}
                        alt={item.nombre}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Detalles */}
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm font-medium text-stone-800 line-clamp-2">
                        {item.nombre}
                      </h3>
                      
                      <div className="text-xs text-stone-600 space-y-1">
                        <div>Talla: {item.talla}</div>
                        <div className="flex items-center gap-2">
                          Color: 
                          <div 
                            className="w-3 h-3 rounded-full border border-stone-300"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {/* Cantidad */}
                          <div className="flex items-center border border-stone-300 rounded">
                            <button
                              onClick={() => actualizarCantidad(item.id, item.talla, item.color, item.cantidad - 1)}
                              className="p-1 hover:bg-stone-50 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-2 py-1 text-xs font-medium min-w-[2rem] text-center">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => actualizarCantidad(item.id, item.talla, item.color, item.cantidad + 1)}
                              className="p-1 hover:bg-stone-50 transition-colors"
                              disabled={item.cantidad >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-stone-800">
                            {formatearPrecio(item.precio * item.cantidad)}
                          </div>
                          <button
                            onClick={() => removerItem(item.id, item.talla, item.color)}
                            className="text-xs text-stone-500 hover:text-red-600 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {estado.items.length > 0 && (
            <div className="border-t border-stone-200 p-6 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-stone-800">Total</span>
                <span className="text-lg font-medium text-stone-800">
                  {formatearPrecio(estado.total)}
                </span>
              </div>

              {/* Envío */}
              <div className="text-sm text-stone-600">
                {estado.total >= 200 ? (
                  <div className="flex items-center justify-between">
                    <span>Envío gratuito</span>
                    <span className="text-green-600 font-medium">GRATIS</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span>Envío</span>
                      <span>{formatearPrecio(15)}</span>
                    </div>
                    <div className="text-xs text-stone-500">
                      Agrega {formatearPrecio(200 - estado.total)} más para envío gratuito
                    </div>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="space-y-3">
                <Link href="/carrito" onClick={toggleCarrito}>
                  <Button 
                    variant="outline" 
                    className="w-full border-stone-300 text-stone-700 hover:bg-stone-50"
                  >
                    Ver carrito completo
                  </Button>
                </Link>
                
                <Link href="/checkout" onClick={toggleCarrito}>
                  <Button className="w-full bg-stone-800 text-white hover:bg-stone-900">
                    Finalizar compra
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
