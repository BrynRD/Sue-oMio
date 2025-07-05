'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}

export default function LoginForm({ onSuccess, redirectTo }: LoginFormProps) {
  const { login, registro } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Obtener returnUrl y action de los parámetros de URL
  const returnUrl = searchParams.get('returnUrl') || redirectTo || '/'
  const action = searchParams.get('action')
  
  const [activeTab, setActiveTab] = useState('login')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Estados para login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Estados para registro
  const [registroData, setRegistroData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmarPassword: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    try {
      const exito = await login(loginData.email, loginData.password)
      if (exito) {
        if (onSuccess) {
          onSuccess()
        } else {
          // Si viene de "comprar ahora", redirigir al checkout
          if (action === 'buy') {
            router.push('/checkout')
          } else {
            router.push(returnUrl)
          }
        }
      } else {
        setError('Credenciales incorrectas')
      }
    } catch (error) {
      setError('Error al iniciar sesión')
      console.error('Error en login:', error)
    } finally {
      setCargando(false)
    }
  }

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    // Validaciones
    if (!registroData.nombre.trim() || !registroData.apellido.trim()) {
      setError('Nombre y apellido son requeridos')
      setCargando(false)
      return
    }

    if (registroData.password !== registroData.confirmarPassword) {
      setError('Las contraseñas no coinciden')
      setCargando(false)
      return
    }

    if (registroData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setCargando(false)
      return
    }

    try {
      const exito = await registro({
        nombre: registroData.nombre,
        apellido: registroData.apellido,
        email: registroData.email,
        telefono: registroData.telefono,
        password: registroData.password
      })
      
      if (exito) {
        if (onSuccess) {
          onSuccess()
        } else {
          // Si viene de "comprar ahora", redirigir al checkout
          if (action === 'buy') {
            router.push('/checkout')
          } else {
            router.push(returnUrl)
          }
        }
      } else {
        setError('Error al crear la cuenta')
      }
    } catch (error) {
      setError('Error al registrarse')
      console.error('Error en registro:', error)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      {/* Enlace sutil para volver al home */}
      <div className="absolute top-6 left-6">
        <Link 
          href="/" 
          className="text-stone-600 hover:text-stone-800 text-sm font-light flex items-center space-x-2 transition-colors"
        >
          <span>←</span>
          <span>Volver a la tienda</span>
        </Link>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-light text-stone-800">
            Sueño Mío
          </CardTitle>
          <CardDescription>
            {action === 'buy' ? 
              'Inicia sesión para completar tu compra' : 
              'Accede a tu cuenta o crea una nueva'
            }
          </CardDescription>
          
          {action === 'buy' && (
            <Alert className="mt-4">
              <AlertDescription className="text-sm">
                💡 Necesitas iniciar sesión para poder realizar la compra
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="registro">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={mostrarPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-stone-800 hover:bg-stone-900"
                  disabled={cargando}
                >
                  {cargando ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="registro">
              <form onSubmit={handleRegistro} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                      <Input
                        id="nombre"
                        type="text"
                        placeholder="Tu nombre"
                        value={registroData.nombre}
                        onChange={(e) => setRegistroData({ ...registroData, nombre: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                      <Input
                        id="apellido"
                        type="text"
                        placeholder="Tu apellido"
                        value={registroData.apellido}
                        onChange={(e) => setRegistroData({ ...registroData, apellido: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registro-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                    <Input
                      id="registro-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={registroData.email}
                      onChange={(e) => setRegistroData({ ...registroData, email: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                    <Input
                      id="telefono"
                      type="tel"
                      placeholder="+51 999 999 999"
                      value={registroData.telefono}
                      onChange={(e) => setRegistroData({ ...registroData, telefono: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registro-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                    <Input
                      id="registro-password"
                      type={mostrarPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={registroData.password}
                      onChange={(e) => setRegistroData({ ...registroData, password: e.target.value })}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmar-password">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                    <Input
                      id="confirmar-password"
                      type="password"
                      placeholder="••••••••"
                      value={registroData.confirmarPassword}
                      onChange={(e) => setRegistroData({ ...registroData, confirmarPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-stone-800 hover:bg-stone-900"
                  disabled={cargando}
                >
                  {cargando ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
