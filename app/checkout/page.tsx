'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingBag, User, Search, Menu, ArrowLeft, CreditCard, Truck, Shield, Check, MapPin, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCarrito } from "@/contexts/CarritoContext"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import Header from "@/components/Header"
import PaymentMethods from "@/components/PaymentMethods"

interface FormularioDatos {
  // Información personal
  email: string
  telefono: string
  
  // Dirección de envío
  nombre: string
  apellidos: string
  direccion: string
  distrito: string
  provincia: string
  codigoPostal: string
  referencia: string
}

export default function CheckoutPage() {
  const { estado: carritoEstado, limpiarCarrito } = useCarrito()
  const { estado: authEstado } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [paso, setPaso] = useState(1) // 1: Envío, 2: Pago, 3: Confirmación
  const [procesando, setProcesando] = useState(false)
  const [pedidoCompletado, setPedidoCompletado] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [formulario, setFormulario] = useState<FormularioDatos>({
    email: authEstado.usuario?.email || '',
    telefono: authEstado.usuario?.telefono || '',
    nombre: authEstado.usuario?.nombre?.split(' ')[0] || '',
    apellidos: authEstado.usuario?.nombre?.split(' ').slice(1).join(' ') || '',
    direccion: '',
    distrito: '',
    provincia: 'Lima',
    codigoPostal: '',
    referencia: ''
  })

  const costoEnvio = carritoEstado.total >= 200 ? 0 : 15
  const totalConEnvio = carritoEstado.total + costoEnvio

  useEffect(() => {
    // Verificar autenticación
    if (!authEstado.autenticado) {
      router.push('/login?returnUrl=/checkout')
      return
    }
    
    if (carritoEstado.items.length === 0) {
      router.push('/productos')
    }
    cargarCategorias()
  }, [carritoEstado.items.length, authEstado.autenticado, router])

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

  const actualizarFormulario = (campo: keyof FormularioDatos, valor: string) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }))
  }

  const validarPaso1 = () => {
    const camposRequeridos: (keyof FormularioDatos)[] = [
      'email', 'telefono', 'nombre', 'apellidos', 'direccion', 'distrito', 'provincia'
    ]
    
    return camposRequeridos.every(campo => formulario[campo].trim() !== '')
  }

  const siguientePaso = () => {
    if (paso === 1 && validarPaso1()) {
      setPaso(2)
    }
  }

  const procesarPedido = async (paymentData: any) => {
    setProcesando(true)
    
    try {
      // Crear el pedido
      const pedidoData = {
        items: carritoEstado.items,
        total: totalConEnvio,
        direccion_envio: `${formulario.direccion}, ${formulario.distrito}, ${formulario.provincia}`,
        metodo_pago: paymentData.metodoPago,
        notas: formulario.referencia,
        datos_envio: formulario,
        datos_pago: paymentData
      }

      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authEstado.token}`,
        },
        body: JSON.stringify(pedidoData),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Pedido creado:', data)
        setPedidoCompletado(true)
        limpiarCarrito()
      } else {
        throw new Error('Error al crear el pedido')
      }
    } catch (error) {
      console.error('Error procesando pedido:', error)
      toast({
        title: "Error al procesar el pedido",
        description: "Ha ocurrido un error. Por favor intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setProcesando(false)
    }
  }

  if (carritoEstado.items.length === 0 && !pedidoCompletado) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header categorias={categorias} />
        <div className="max-w-md mx-auto text-center py-20">
          <ShoppingBag className="h-16 w-16 text-stone-400 mx-auto mb-6" />
          <h1 className="text-2xl font-light text-stone-800 mb-4">
            Tu carrito está vacío
          </h1>
          <p className="text-stone-600 mb-8">
            Agrega algunos productos antes de proceder al checkout.
          </p>
          <Link href="/productos">
            <Button className="bg-stone-800 text-white hover:bg-stone-900">
              Explorar Productos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (pedidoCompletado) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header categorias={categorias} />
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-light text-stone-800 mb-4">
            ¡Pedido confirmado!
          </h1>
          <p className="text-stone-600 mb-8">
            Recibirás un email de confirmación con los detalles de tu pedido.
          </p>
          <div className="space-y-3">
            <Link href="/productos">
              <Button className="w-full bg-stone-800 text-white hover:bg-stone-900">
                Continuar comprando
              </Button>
            </Link>
            {authEstado.autenticado && (
              <Link href="/perfil">
                <Button variant="outline" className="w-full border-stone-300 text-stone-700">
                  Ver mis pedidos
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-stone-600 mb-8">
          <Link href="/carrito" className="hover:text-stone-800">
            Carrito
          </Link>
          <span>/</span>
          <span className="text-stone-800">Checkout</span>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              paso >= 1 ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-px ${paso >= 2 ? 'bg-stone-800' : 'bg-stone-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              paso >= 2 ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              2
            </div>
            <div className={`w-12 h-px ${paso >= 3 ? 'bg-stone-800' : 'bg-stone-200'}`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              paso >= 3 ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              3
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Formulario */}
          <div className="space-y-8">
            {paso === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-light text-stone-800 mb-6">
                    Información de Envío
                  </h2>
                  
                  {/* Información de Contacto */}
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg font-light flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Información de Contacto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formulario.email}
                            onChange={(e) => actualizarFormulario('email', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefono">Teléfono *</Label>
                          <Input
                            id="telefono"
                            type="tel"
                            value={formulario.telefono}
                            onChange={(e) => actualizarFormulario('telefono', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dirección de Envío */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-light flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Dirección de Envío
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombre">Nombre *</Label>
                          <Input
                            id="nombre"
                            value={formulario.nombre}
                            onChange={(e) => actualizarFormulario('nombre', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apellidos">Apellidos *</Label>
                          <Input
                            id="apellidos"
                            value={formulario.apellidos}
                            onChange={(e) => actualizarFormulario('apellidos', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="direccion">Dirección *</Label>
                        <Input
                          id="direccion"
                          placeholder="Av. Principal 123, Miraflores"
                          value={formulario.direccion}
                          onChange={(e) => actualizarFormulario('direccion', e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="distrito">Distrito *</Label>
                          <Input
                            id="distrito"
                            value={formulario.distrito}
                            onChange={(e) => actualizarFormulario('distrito', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provincia">Provincia *</Label>
                          <Input
                            id="provincia"
                            value={formulario.provincia}
                            onChange={(e) => actualizarFormulario('provincia', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="codigoPostal">Código Postal</Label>
                          <Input
                            id="codigoPostal"
                            value={formulario.codigoPostal}
                            onChange={(e) => actualizarFormulario('codigoPostal', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="referencia">Referencia (opcional)</Label>
                        <Input
                          id="referencia"
                          placeholder="Casa blanca con puerta verde"
                          value={formulario.referencia}
                          onChange={(e) => actualizarFormulario('referencia', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button 
                  onClick={siguientePaso}
                  disabled={!validarPaso1()}
                  className="w-full bg-stone-800 hover:bg-stone-900"
                  size="lg"
                >
                  Continuar al Pago
                </Button>
              </div>
            )}

            {paso === 2 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-light text-stone-800">
                    Método de Pago
                  </h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => setPaso(1)}
                    className="text-stone-600 hover:text-stone-800"
                  >
                    ← Volver
                  </Button>
                </div>

                <PaymentMethods
                  total={totalConEnvio}
                  onPaymentComplete={procesarPedido}
                  isProcessing={procesando}
                />
              </div>
            )}
          </div>

          {/* Resumen del Pedido */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-light flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Resumen del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items del carrito */}
                <div className="space-y-3">
                  {carritoEstado.items.map((item) => (
                    <div key={`${item.id}-${item.talla}-${item.color}`} className="flex items-center space-x-3">
                      <div className="relative">
                        <Image
                          src={item.imagen}
                          alt={item.nombre}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                        <div className="absolute -top-2 -right-2 bg-stone-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {item.cantidad}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.nombre}</p>
                        <p className="text-xs text-stone-600">
                          {item.talla && `Talla: ${item.talla}`}
                          {item.talla && item.color && ' • '}
                          {item.color && `Color: ${item.color}`}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        S/ {(item.precio * item.cantidad).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totales */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Subtotal</span>
                    <span>S/ {carritoEstado.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Envío</span>
                    <span>
                      {costoEnvio === 0 ? (
                        <span className="text-green-600">Gratis</span>
                      ) : (
                        `S/ ${costoEnvio.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>S/ {totalConEnvio.toFixed(2)}</span>
                  </div>
                </div>

                {carritoEstado.total < 200 && (
                  <div className="text-xs text-stone-500 text-center bg-stone-50 p-3 rounded-lg">
                    <Truck className="h-4 w-4 inline mr-1" />
                    Envío gratis en compras mayores a S/ 200
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información de Seguridad */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-xs text-stone-600">
                  <Shield className="h-4 w-4" />
                  <span>Compra 100% segura y protegida</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
                