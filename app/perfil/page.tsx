'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Package, 
  CreditCard, 
  Shield,
  Edit
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

export default function PerfilPage() {
  const { estado } = useAuth()
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [categorias, setCategorias] = useState([])

  const [datosUsuario, setDatosUsuario] = useState({
    nombre: '',
    email: '',
    telefono: '',
  })

  useEffect(() => {
    if (!estado.autenticado) {
      router.push('/login')
      return
    }

    if (estado.usuario) {
      setDatosUsuario({
        nombre: estado.usuario.nombre || '',
        email: estado.usuario.email || '',
        telefono: estado.usuario.telefono || '',
      })
    }

    // Cargar categorías para el header
    cargarCategorias()
    cargarPedidos()
  }, [estado, router])

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

  const cargarPedidos = async () => {
    try {
      const response = await fetch('/api/pedidos', {
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPedidos(data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error)
    }
  }

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setMensaje('')

    try {
      const response = await fetch(`/api/usuarios/${estado.usuario?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${estado.token}`,
        },
        body: JSON.stringify(datosUsuario),
      })

      if (response.ok) {
        setMensaje('Perfil actualizado correctamente')
        setEditando(false)
      } else {
        setMensaje('Error al actualizar el perfil')
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      setMensaje('Error al actualizar el perfil')
    } finally {
      setCargando(false)
    }
  }

  if (!estado.autenticado) {
    return null
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-stone-800">Mi Perfil</h1>
          <p className="text-stone-600 mt-2">Gestiona tu información personal y pedidos</p>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil">Información Personal</TabsTrigger>
            <TabsTrigger value="pedidos">Mis Pedidos</TabsTrigger>
            <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-light">Información Personal</CardTitle>
                    <CardDescription>
                      Actualiza tu información de contacto
                    </CardDescription>
                  </div>
                  <Button
                    variant={editando ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setEditando(!editando)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {editando ? 'Cancelar' : 'Editar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={guardarCambios} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                        <Input
                          id="nombre"
                          value={datosUsuario.nombre}
                          onChange={(e) => setDatosUsuario({ ...datosUsuario, nombre: e.target.value })}
                          className="pl-10"
                          disabled={!editando}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                        <Input
                          id="email"
                          type="email"
                          value={datosUsuario.email}
                          onChange={(e) => setDatosUsuario({ ...datosUsuario, email: e.target.value })}
                          className="pl-10"
                          disabled={!editando}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                        <Input
                          id="telefono"
                          value={datosUsuario.telefono}
                          onChange={(e) => setDatosUsuario({ ...datosUsuario, telefono: e.target.value })}
                          className="pl-10"
                          disabled={!editando}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Usuario</Label>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-stone-400" />
                        <Badge variant={estado.usuario?.rol === 'admin' ? 'default' : 'secondary'}>
                          {estado.usuario?.rol === 'admin' ? 'Administrador' : 'Cliente'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Registro</Label>
                    <div className="flex items-center space-x-2 text-stone-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(estado.usuario?.fecha_registro || '').toLocaleDateString('es-PE')}</span>
                    </div>
                  </div>

                  {mensaje && (
                    <Alert>
                      <AlertDescription>{mensaje}</AlertDescription>
                    </Alert>
                  )}

                  {editando && (
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={cargando}
                        className="bg-stone-800 hover:bg-stone-900"
                      >
                        {cargando ? 'Guardando...' : 'Guardar Cambios'}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pedidos">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-light">Mis Pedidos</CardTitle>
                <CardDescription>
                  Historial de tus compras y estado de pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pedidos.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                    <p className="text-stone-600">No tienes pedidos aún</p>
                    <Button 
                      className="mt-4 bg-stone-800 hover:bg-stone-900"
                      onClick={() => router.push('/productos')}
                    >
                      Explorar Productos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidos.map((pedido: any) => (
                      <div key={pedido.id} className="border border-stone-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">Pedido #{pedido.id}</p>
                            <p className="text-sm text-stone-600">
                              {new Date(pedido.fecha_pedido).toLocaleDateString('es-PE')}
                            </p>
                          </div>
                          <Badge variant={
                            pedido.estado === 'completado' ? 'default' :
                            pedido.estado === 'enviado' ? 'secondary' :
                            pedido.estado === 'cancelado' ? 'destructive' : 'outline'
                          }>
                            {pedido.estado}
                          </Badge>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center">
                          <p className="text-stone-600">Total: S/ {pedido.total}</p>
                          <Button variant="outline" size="sm">
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seguridad">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-light">Seguridad</CardTitle>
                <CardDescription>
                  Cambia tu contraseña y gestiona la seguridad de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-stone-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Contraseña</p>
                        <p className="text-sm text-stone-600">Última actualización hace 30 días</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Cambiar Contraseña
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-stone-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Métodos de Pago</p>
                        <p className="text-sm text-stone-600">Gestiona tus tarjetas guardadas</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Gestionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
