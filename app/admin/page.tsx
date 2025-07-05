'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'

interface EstadisticasDashboard {
  total_productos: number
  total_clientes: number
  total_pedidos: number
  pedidos_pendientes: number
  ingresos_mes: number
  productos_stock_bajo: number
}

interface PedidoReciente {
  id: number
  usuario_nombre: string
  total: number
  estado: string
  fecha_pedido: string
}

interface ProductoPopular {
  id: number
  nombre: string
  precio: number
  imagen: string
  ventas_total: number
}

export default function AdminDashboard() {
  const { estado } = useAuth()
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [estadisticas, setEstadisticas] = useState<EstadisticasDashboard | null>(null)
  const [pedidosRecientes, setPedidosRecientes] = useState<PedidoReciente[]>([])
  const [productosPopulares, setProductosPopulares] = useState<ProductoPopular[]>([])
  const [categorias, setCategorias] = useState<any[]>([])

  // Función helper para formatear precios de manera segura
  const formatearPrecio = (precio: any): string => {
    if (precio === null || precio === undefined) return '0.00'
    const numPrecio = typeof precio === 'number' ? precio : parseFloat(precio.toString())
    return isNaN(numPrecio) ? '0.00' : numPrecio.toFixed(2)
  }

  useEffect(() => {
    // Esperar a que termine de cargar el contexto de autenticación
    if (estado.cargando) {
      return
    }

    if (!estado.autenticado) {
      router.push('/login')
      return
    }

    if (estado.usuario?.rol !== 'admin') {
      router.push('/')
      return
    }

    cargarDatosIniciales()
  }, [estado, router])

  const cargarDatosIniciales = async () => {
    setCargando(true)
    try {
      await Promise.all([
        cargarEstadisticas(),
        cargarPedidosRecientes(),
        cargarProductosPopulares(),
        cargarCategorias()
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar los datos del dashboard')
    } finally {
      setCargando(false)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch('/api/dashboard/estadisticas', {
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setEstadisticas(data.data)
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error)
    }
  }

  const cargarPedidosRecientes = async () => {
    try {
      const response = await fetch('/api/dashboard/pedidos-recientes', {
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPedidosRecientes(data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar pedidos recientes:', error)
    }
  }

  const cargarProductosPopulares = async () => {
    try {
      const response = await fetch('/api/dashboard/productos-mas-vendidos', {
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProductosPopulares(data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar productos populares:', error)
    }
  }

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

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
        return 'default'
      case 'enviado':
        return 'secondary'
      case 'procesando':
        return 'outline'
      case 'cancelado':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Mostrar loading mientras se hidrata el contexto
  if (estado.cargando) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto mb-4"></div>
          <p className="text-stone-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!estado.autenticado || estado.usuario?.rol !== 'admin') {
    return null
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header categorias={categorias} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto mb-4"></div>
            <p className="text-stone-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header del Dashboard */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-light text-stone-800">Panel de Administración</h1>
              <p className="text-stone-600 mt-2">Gestiona tu tienda desde aquí</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
              <Button asChild className="bg-stone-800 hover:bg-stone-900">
                <Link href="/admin/productos">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/categorias">
                  <Package className="h-4 w-4 mr-2" />
                  Gestionar Categorías
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-stone-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                S/ {formatearPrecio(estadisticas?.ingresos_mes)}
              </div>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                Mes actual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-stone-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas?.total_pedidos || 0}</div>
              <p className="text-xs text-blue-600 mt-1">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                {estadisticas?.pedidos_pendientes || 0} pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos</CardTitle>
              <Package className="h-4 w-4 text-stone-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas?.total_productos || 0}</div>
              <p className="text-xs text-orange-600 mt-1">
                <AlertCircle className="h-3 w-3 inline mr-1" />
                {estadisticas?.productos_stock_bajo || 0} stock bajo
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-stone-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas?.total_clientes || 0}</div>
              <p className="text-xs text-stone-600 mt-1">Usuarios registrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Accesos Rápidos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-light">Accesos Rápidos</CardTitle>
            <CardDescription>
              Gestiona los elementos principales de tu tienda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="h-auto p-4 flex-col space-y-2">
                <Link href="/admin/productos">
                  <Package className="h-6 w-6" />
                  <span>Productos</span>
                  <span className="text-xs opacity-70">Gestionar inventario</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Link href="/admin/categorias">
                  <Package className="h-6 w-6" />
                  <span>Categorías</span>
                  <span className="text-xs opacity-70">Organizar productos</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Link href="/admin/pedidos">
                  <ShoppingCart className="h-6 w-6" />
                  <span>Pedidos</span>
                  <span className="text-xs opacity-70">Gestionar ventas</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto p-4 flex-col space-y-2">
                <Link href="/admin/usuarios">
                  <Users className="h-6 w-6" />
                  <span>Usuarios</span>
                  <span className="text-xs opacity-70">Administrar clientes</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navegación por Pestañas */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pedidos Recientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-light">Pedidos Recientes</CardTitle>
                  <CardDescription>
                    Últimos pedidos realizados en la tienda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pedidosRecientes.slice(0, 5).map((pedido) => (
                      <div key={pedido.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Pedido #{pedido.id}</p>
                          <p className="text-sm text-stone-600">{pedido.usuario_nombre}</p>
                          <p className="text-xs text-stone-500">
                            {new Date(pedido.fecha_pedido).toLocaleDateString('es-PE')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">S/ {formatearPrecio(pedido.total)}</p>
                          <Badge variant={getEstadoBadgeVariant(pedido.estado)}>
                            {pedido.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {pedidosRecientes.length === 0 && (
                      <p className="text-center text-stone-500 py-4">
                        No hay pedidos recientes
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin/pedidos">Ver Todos los Pedidos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Productos Más Vendidos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-light">Productos Más Vendidos</CardTitle>
                  <CardDescription>
                    Los productos con mejor rendimiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productosPopulares.slice(0, 5).map((producto) => (
                      <div key={producto.id} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-stone-200 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{producto.nombre}</p>
                          <p className="text-sm text-stone-600">
                            {producto.ventas_total} vendidos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">S/ {formatearPrecio(producto.precio)}</p>
                        </div>
                      </div>
                    ))}
                    {productosPopulares.length === 0 && (
                      <p className="text-center text-stone-500 py-4">
                        No hay datos de ventas
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin/productos">Ver Todos los Productos</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-light">Gestión de Pedidos</CardTitle>
                <CardDescription>
                  Administra todos los pedidos de la tienda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                  <p className="text-stone-600 mb-4">
                    Vista detallada de pedidos en desarrollo
                  </p>
                  <Button asChild>
                    <Link href="/admin/pedidos">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Pedidos Detallados
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-light">Gestión de Productos</CardTitle>
                <CardDescription>
                  Administra el catálogo de productos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                  <p className="text-stone-600 mb-4">
                    Vista detallada de productos en desarrollo
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button asChild>
                      <Link href="/admin/productos">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Productos
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/admin/productos/nuevo">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Producto
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-light">Análisis y Reportes</CardTitle>
                <CardDescription>
                  Estadísticas avanzadas y reportes de ventas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                  <p className="text-stone-600">
                    Análisis avanzados próximamente
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
