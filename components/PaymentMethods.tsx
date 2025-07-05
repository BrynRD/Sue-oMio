'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  Shield, 
  Lock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

interface PaymentMethodsProps {
  total: number
  onPaymentComplete: (paymentData: any) => void
  isProcessing: boolean
}

export default function PaymentMethods({ total, onPaymentComplete, isProcessing }: PaymentMethodsProps) {
  const [metodoPago, setMetodoPago] = useState('tarjeta')
  const [datosTabla, setDatosTarjeta] = useState({
    numeroTarjeta: '',
    fechaVencimiento: '',
    cvv: '',
    nombreTitular: ''
  })
  const [error, setError] = useState('')

  const validarTarjeta = () => {
    // Validación básica de tarjeta
    if (datosTabla.numeroTarjeta.length < 16) {
      setError('El número de tarjeta debe tener 16 dígitos')
      return false
    }
    
    if (datosTabla.fechaVencimiento.length !== 5) {
      setError('La fecha de vencimiento debe tener formato MM/YY')
      return false
    }
    
    if (datosTabla.cvv.length < 3) {
      setError('El CVV debe tener al menos 3 dígitos')
      return false
    }
    
    if (datosTabla.nombreTitular.trim().length < 2) {
      setError('El nombre del titular es requerido')
      return false
    }
    
    return true
  }

  const procesarPago = async () => {
    setError('')
    
    if (metodoPago === 'tarjeta' && !validarTarjeta()) {
      return
    }

    try {
      let paymentData: any = {
        metodoPago,
        total,
        moneda: 'PEN'
      }

      if (metodoPago === 'tarjeta') {
        // Simular integración con Culqi
        paymentData = {
          ...paymentData,
          tarjeta: {
            ...datosTabla,
            numeroTarjeta: datosTabla.numeroTarjeta.slice(-4) // Solo últimos 4 dígitos para seguridad
          }
        }
        
        // Simulación de procesamiento con Culqi
        console.log('Procesando pago con Culqi:', paymentData)
        
        // Aquí iría la llamada real a Culqi
        /*
        const culqiResponse = await fetch('/api/payments/culqi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: total * 100, // Culqi requiere centavos
            currency_code: 'PEN',
            email: 'cliente@email.com',
            source_id: 'token_from_culqi_js'
          }),
        })
        */
      }

      // Simular respuesta exitosa
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onPaymentComplete(paymentData)
      
    } catch (error) {
      console.error('Error procesando pago:', error)
      setError('Error al procesar el pago. Intenta nuevamente.')
    }
  }

  const formatearNumeroTarjeta = (value: string) => {
    // Formatear número de tarjeta con espacios
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatearFechaVencimiento = (value: string) => {
    // Formatear fecha MM/YY
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const formatted = v.match(/.{1,2}/g)?.join('/') || v
    return formatted.substring(0, 5)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-stone-800 mb-4">
          Método de Pago
        </h3>
        
        <RadioGroup value={metodoPago} onValueChange={setMetodoPago}>
          <div className="grid gap-4">
            {/* Tarjeta de Crédito/Débito */}
            <Card className={`cursor-pointer transition-colors ${metodoPago === 'tarjeta' ? 'ring-2 ring-stone-800' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="tarjeta" id="tarjeta" />
                  <CreditCard className="h-5 w-5 text-stone-600" />
                  <div className="flex-1">
                    <Label htmlFor="tarjeta" className="text-sm font-medium cursor-pointer">
                      Tarjeta de Crédito/Débito
                    </Label>
                    <p className="text-xs text-stone-500">
                      Visa, Mastercard, American Express
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-stone-500">
                    <Shield className="h-4 w-4" />
                    <span>Seguro</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Yape */}
            <Card className={`cursor-pointer transition-colors ${metodoPago === 'yape' ? 'ring-2 ring-stone-800' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="yape" id="yape" />
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <Label htmlFor="yape" className="text-sm font-medium cursor-pointer">
                      Yape
                    </Label>
                    <p className="text-xs text-stone-500">
                      Pago inmediato desde tu app
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plin */}
            <Card className={`cursor-pointer transition-colors ${metodoPago === 'plin' ? 'ring-2 ring-stone-800' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="plin" id="plin" />
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <Label htmlFor="plin" className="text-sm font-medium cursor-pointer">
                      Plin
                    </Label>
                    <p className="text-xs text-stone-500">
                      Pago inmediato desde tu app
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contra Entrega */}
            <Card className={`cursor-pointer transition-colors ${metodoPago === 'efectivo' ? 'ring-2 ring-stone-800' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="efectivo" id="efectivo" />
                  <Banknote className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <Label htmlFor="efectivo" className="text-sm font-medium cursor-pointer">
                      Contra Entrega
                    </Label>
                    <p className="text-xs text-stone-500">
                      Paga cuando recibas tu pedido
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </RadioGroup>
      </div>

      {/* Formulario de Tarjeta */}
      {metodoPago === 'tarjeta' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-light flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Datos de la Tarjeta
            </CardTitle>
            <CardDescription>
              Tus datos están protegidos con cifrado SSL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numeroTarjeta">Número de Tarjeta</Label>
              <Input
                id="numeroTarjeta"
                placeholder="1234 5678 9012 3456"
                value={datosTabla.numeroTarjeta}
                onChange={(e) => setDatosTarjeta({
                  ...datosTabla,
                  numeroTarjeta: formatearNumeroTarjeta(e.target.value)
                })}
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                <Input
                  id="fechaVencimiento"
                  placeholder="MM/YY"
                  value={datosTabla.fechaVencimiento}
                  onChange={(e) => setDatosTarjeta({
                    ...datosTabla,
                    fechaVencimiento: formatearFechaVencimiento(e.target.value)
                  })}
                  maxLength={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={datosTabla.cvv}
                  onChange={(e) => setDatosTarjeta({
                    ...datosTabla,
                    cvv: e.target.value.replace(/\D/g, '')
                  })}
                  maxLength={4}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreTitular">Nombre del Titular</Label>
              <Input
                id="nombreTitular"
                placeholder="Nombre como aparece en la tarjeta"
                value={datosTabla.nombreTitular}
                onChange={(e) => setDatosTarjeta({
                  ...datosTabla,
                  nombreTitular: e.target.value
                })}
              />
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Procesamos pagos de forma segura a través de Culqi, certificado PCI DSS.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Información de Yape/Plin */}
      {(metodoPago === 'yape' || metodoPago === 'plin') && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                <Smartphone className="h-8 w-8 text-stone-600" />
              </div>
              <div>
                <h4 className="font-medium text-stone-800">
                  Pago con {metodoPago === 'yape' ? 'Yape' : 'Plin'}
                </h4>
                <p className="text-sm text-stone-600 mt-1">
                  Serás redirigido a la app para completar el pago
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen del Pago */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Total a pagar:</span>
              <span className="font-medium">S/ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-600">Método de pago:</span>
              <span className="font-medium capitalize">
                {metodoPago === 'tarjeta' ? 'Tarjeta' : 
                 metodoPago === 'yape' ? 'Yape' :
                 metodoPago === 'plin' ? 'Plin' : 'Contra Entrega'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={procesarPago}
        disabled={isProcessing}
        className="w-full bg-stone-800 hover:bg-stone-900"
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Procesando pago...
          </div>
        ) : (
          `Pagar S/ ${total.toFixed(2)}`
        )}
      </Button>
    </div>
  )
}
