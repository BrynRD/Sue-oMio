'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Producto } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Eye,
  ArrowLeft,
  AlertCircle,
  Package
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'

// Helper function to get product state
function getProductState(producto: Producto): 'activo' | 'inactivo' | 'eliminado' {
  if (producto.eliminado) return 'eliminado'
  if (producto.activo) return 'activo'
  return 'inactivo'
}

interface Categoria {
  id: number
  nombre: string
}

export default function AdminProductosPage() {
  const { estado } = useAuth()
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('all')
  const [filtroEstado, setFiltroEstado] = useState('todos') // 'activos', 'inactivos', 'eliminados', 'todos'
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoProducto, setEditandoProducto] = useState<Producto | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Función helper para manejar precios de manera segura
  const formatearPrecio = (precio: any): string => {
    if (precio === null || precio === undefined) return '0.00'
    const numPrecio = typeof precio === 'string' ? parseFloat(precio) : precio
    return isNaN(numPrecio) ? '0.00' : numPrecio.toFixed(2)
  }

  // Tasas de cambio actualizadas (en una implementación real, estas vendrían de una API)
  const TASAS_CAMBIO = {
    PEN_TO_USD: 0.268, // 1 PEN = 0.268 USD (actualizado)
    PEN_TO_EUR: 0.249  // 1 PEN = 0.249 EUR (actualizado)
  }

  // TODO: En el futuro, obtener tasas de cambio reales desde una API
  // useEffect(() => {
  //   const obtenerTasasCambio = async () => {
  //     try {
  //       const response = await fetch('https://api.exchangerate-api.com/v4/latest/PEN')
  //       const data = await response.json()
  //       setTasasCambio({
  //         PEN_TO_USD: data.rates.USD,
  //         PEN_TO_EUR: data.rates.EUR
  //       })
  //     } catch (error) {
  //       console.log('Usando tasas de cambio por defecto')
  //     }
  //   }
  //   obtenerTasasCambio()
  // }, [])

  // Función para calcular precios automáticamente basado en PEN
  const calcularPreciosAutomaticos = (precioPen: string) => {
    const precioNum = parseFloat(precioPen)
    if (isNaN(precioNum) || precioNum <= 0) {
      return {
        precio_usd: '',
        precio_eur: ''
      }
    }

    return {
      precio_usd: (precioNum * TASAS_CAMBIO.PEN_TO_USD).toFixed(2),
      precio_eur: (precioNum * TASAS_CAMBIO.PEN_TO_EUR).toFixed(2)
    }
  }

  // Función para alternar entre modo automático y manual
  const alternarModoPrecios = () => {
    if (modoPrecios === 'automatico') {
      // Cambiar a manual - mantener los valores actuales
      setModoPrecios('manual')
    } else {
      // Cambiar a automático - recalcular desde PEN
      setModoPrecios('automatico')
      if (formularioProducto.precio_pen) {
        const preciosCalculados = calcularPreciosAutomaticos(formularioProducto.precio_pen)
        setFormularioProducto(prev => ({
          ...prev,
          precio_usd: preciosCalculados.precio_usd,
          precio_eur: preciosCalculados.precio_eur
        }))
      }
    }
  }

  const [formularioProducto, setFormularioProducto] = useState({
    nombre: '',
    descripcion: '',
    precio_pen: '',
    precio_usd: '',
    precio_eur: '',
    stock: '',
    categoria_id: '',
    imagen: '',
    destacado: false,
    activo: true
  })

  // Estado para el modo de precios (automático vs manual)
  const [modoPrecios, setModoPrecios] = useState<'automatico' | 'manual'>('automatico')

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

    cargarDatos()
  }, [estado, router])

  // Recargar productos cuando cambien los filtros
  useEffect(() => {
    if (!estado.cargando && estado.autenticado && estado.usuario?.rol === 'admin') {
      cargarProductos()
    }
  }, [filtroEstado, busqueda, filtroCategoria])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      await Promise.all([
        cargarProductos(),
        cargarCategorias()
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar los datos')
    } finally {
      setCargando(false)
    }
  }

  const cargarProductos = async () => {
    try {
      const params = new URLSearchParams({
        admin: 'true',
        incluir_categoria: 'true'
      })
      
      if (filtroEstado !== 'todos') {
        params.append('estado', filtroEstado)
      }
      
      if (busqueda) {
        params.append('busqueda', busqueda)
      }
      
      if (filtroCategoria !== 'all') {
        params.append('categoria_id', filtroCategoria)
      }

      const response = await fetch(`/api/productos?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProductos(data.success ? data.data.map((p: any) => ({ 
          ...p, 
          activo: p.activo !== undefined ? !!p.activo : true, 
          imagen_url: p.imagen_principal || p.imagen_url || '',
          estado_producto: p.estado_producto || (p.activo ? 'activo' : 'inactivo')
        })) : [])
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
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

  const abrirModalNuevo = () => {
    setEditandoProducto(null)
    setFormularioProducto({
      nombre: '',
      descripcion: '',
      precio_pen: '',
      precio_usd: '',
      precio_eur: '',
      stock: '',
      categoria_id: '',
      imagen: '',
      destacado: false,
      activo: true
    })
    setModoPrecios('automatico') // Reset al modo automático
    setModalAbierto(true)
  }

  const abrirModalEditar = (producto: Producto) => {
    setEditandoProducto(producto)
    setFormularioProducto({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio_pen: producto.precio_pen ? producto.precio_pen.toString() : '',
      precio_usd: producto.precio_usd ? producto.precio_usd.toString() : '',
      precio_eur: producto.precio_eur ? producto.precio_eur.toString() : '',
      stock: (producto.stock || 0).toString(),
      categoria_id: (producto.categoria_id || '').toString(),
      imagen: producto.imagen_url || '',
      destacado: producto.destacado || false,
      activo: producto.activo !== undefined ? !!producto.activo : true
    })
    // Detectar si los precios fueron calculados automáticamente o son manuales
    const precioPen = producto.precio_pen ? parseFloat(producto.precio_pen.toString()) : 0
    const preciosCalculados = calcularPreciosAutomaticos(precioPen.toString())
    const esModoAutomatico = 
      Math.abs((producto.precio_usd || 0) - parseFloat(preciosCalculados.precio_usd || '0')) < 0.01 &&
      Math.abs((producto.precio_eur || 0) - parseFloat(preciosCalculados.precio_eur || '0')) < 0.01
    
    setModoPrecios(esModoAutomatico ? 'automatico' : 'manual')
    setModalAbierto(true)
  }

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError('')

    try {
      // Asegurar que la imagen tenga el prefijo '/uploads/' si es un archivo local
      let imagen = formularioProducto.imagen;
      if (imagen && !imagen.startsWith('http') && !imagen.startsWith('/uploads/')) {
        imagen = '/uploads/' + imagen.replace(/^\\+|^\/+/, '');
      }

      const url = editandoProducto 
        ? `/api/productos/${editandoProducto.id}`
        : '/api/productos'
      
      const method = editandoProducto ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${estado.token}`,
        },
        body: JSON.stringify({
          nombre: formularioProducto.nombre,
          descripcion: formularioProducto.descripcion,
          precio_pen: parseFloat(formularioProducto.precio_pen),
          precio_usd: parseFloat(formularioProducto.precio_usd),
          precio_eur: parseFloat(formularioProducto.precio_eur),
          stock: parseInt(formularioProducto.stock),
          categoria_id: parseInt(formularioProducto.categoria_id),
          destacado: formularioProducto.destacado,
          activo: formularioProducto.activo
        }),
      })

      if (response.ok) {
        // Asociar imagen principal si hay una imagen seleccionada
        if (formularioProducto.imagen) {
          const productoId = editandoProducto ? editandoProducto.id : (await response.json()).data.id;
          await fetch(`/api/productos/${productoId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${estado.token}`,
            },
            body: JSON.stringify({ url: formularioProducto.imagen }),
          });
        }
        await cargarProductos()
        setModalAbierto(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar producto')
      }
    } catch (error) {
      console.error('Error al guardar producto:', error)
      setError('Error al guardar producto')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarProducto = async (id: number) => {
    const nombreProducto = productos.find(p => p.id === id)?.nombre || 'producto'
    
    if (!confirm(`¿Estás seguro de que deseas eliminar "${nombreProducto}"? Se marcará para eliminación y podrás restaurarlo después.`)) {
      return
    }

    try {
      const response = await fetch(`/api/productos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })

      if (response.ok) {
        await cargarProductos()
      } else {
        setError('Error al eliminar producto')
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      setError('Error al eliminar producto')
    }
  }

  const desactivarProducto = async (id: number) => {
    if (!confirm('¿Deseas desactivar este producto? Se ocultará del catálogo pero podrás reactivarlo.')) {
      return
    }

    try {
      const response = await fetch(`/api/productos/${id}/desactivar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })

      if (response.ok) {
        await cargarProductos()
      } else {
        setError('Error al desactivar producto')
      }
    } catch (error) {
      console.error('Error al desactivar producto:', error)
      setError('Error al desactivar producto')
    }
  }

  const activarProducto = async (id: number) => {
    try {
      const response = await fetch(`/api/productos/${id}/activar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })

      if (response.ok) {
        await cargarProductos()
      } else {
        setError('Error al activar producto')
      }
    } catch (error) {
      console.error('Error al activar producto:', error)
      setError('Error al activar producto')
    }
  }

  const restaurarProducto = async (id: number) => {
    if (!confirm('¿Deseas restaurar este producto eliminado?')) {
      return
    }

    try {
      const response = await fetch(`/api/productos/${id}/restaurar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })

      if (response.ok) {
        await cargarProductos()
      } else {
        setError('Error al restaurar producto')
      }
    } catch (error) {
      console.error('Error al restaurar producto:', error)
      setError('Error al restaurar producto')
    }
  }

  const eliminarProductoPermanentemente = async (id: number) => {
    const nombreProducto = productos.find(p => p.id === id)?.nombre || 'producto'
    
    if (!confirm(`⚠️ ELIMINACIÓN PERMANENTE\n\n¿Eliminar permanentemente "${nombreProducto}"?\n\n• Esta acción NO se puede deshacer\n• El producto se eliminará completamente\n• Los pedidos históricos mantendrán el registro\n\n¿Continuar?`)) {
      return
    }

    try {
      const response = await fetch(`/api/productos/${id}/eliminar-permanente`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })

      if (response.ok) {
        await cargarProductos()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar producto permanentemente')
      }
    } catch (error) {
      console.error('Error al eliminar producto permanentemente:', error)
      setError('Error al eliminar producto permanentemente')
    }
  }

  // Simplificar filtrado ya que ahora se hace en el servidor
  const productosFiltrados = productos

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
            <p className="text-stone-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-light text-stone-800">Gestión de Productos</h1>
              <p className="text-stone-600 mt-2">Administra el catálogo de productos</p>
            </div>
            <Button onClick={abrirModalNuevo} className="mt-4 sm:mt-0 bg-stone-800 hover:bg-stone-900">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.filter(categoria => categoria.id).map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="activos">✅ Activos</SelectItem>
                  <SelectItem value="inactivos">⏸️ Inactivos</SelectItem>
                  <SelectItem value="eliminados">🗑️ Eliminados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Productos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-light">
              Productos ({productosFiltrados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {productosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                <p className="text-stone-600 mb-4">No se encontraron productos</p>
                <Button onClick={abrirModalNuevo}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Producto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productosFiltrados.map((producto) => (
                      <TableRow key={producto.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-stone-200 rounded-lg flex-shrink-0">
                              <Image
                                src={producto.imagen_url || '/placeholder.jpg'}
                                alt={producto.nombre}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{producto.nombre}</p>
                              <p className="text-sm text-stone-600 truncate max-w-xs">
                                {producto.descripcion}
                              </p>
                              {producto.destacado && (
                                <Badge variant="secondary" className="mt-1">
                                  Destacado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{producto.categoria_nombre || 'Sin categoría'}</TableCell>
                        <TableCell>S/ {formatearPrecio(producto.precio_pen)}</TableCell>
                        <TableCell>
                          <Badge variant={(producto.stock || 0) > 0 ? 'default' : 'destructive'}>
                            {producto.stock || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              getProductState(producto) === 'activo' ? 'default' : 
                              getProductState(producto) === 'inactivo' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {getProductState(producto) === 'activo' ? '✅ Activo' : 
                             getProductState(producto) === 'inactivo' ? '⏸️ Inactivo' : 
                             '🗑️ Eliminado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {/* Botón de variantes - siempre visible */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/productos/${producto.id}/variantes`)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Gestionar Variantes"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            
                            {/* Botones según el estado del producto */}
                            {getProductState(producto) === 'eliminado' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => restaurarProducto(producto.id)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Restaurar Producto"
                                >
                                  <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarProductoPermanentemente(producto.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Eliminar Permanentemente"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => abrirModalEditar(producto)}
                                  title="Editar Producto"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                {getProductState(producto) === 'activo' ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => desactivarProducto(producto.id)}
                                    className="text-orange-600 hover:text-orange-800"
                                    title="Desactivar Producto"
                                  >
                                    ⏸️
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => activarProducto(producto.id)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Activar Producto"
                                  >
                                    ▶️
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => eliminarProducto(producto.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Eliminar Producto"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Producto */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editandoProducto ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {editandoProducto ? 'Modifica los datos del producto' : 'Completa la información del nuevo producto'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Banner informativo de tasas de cambio */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-800">
                <div className="text-sm font-medium">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${modoPrecios === 'automatico' ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`}></span>
                  💱 Modo de Precios: {modoPrecios === 'automatico' ? 'Automático' : 'Manual'}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={alternarModoPrecios}
                className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Cambiar a {modoPrecios === 'automatico' ? 'Manual' : 'Automático'}
              </Button>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              {modoPrecios === 'automatico' 
                ? 'Los precios USD y EUR se calculan automáticamente desde PEN'
                : 'Puedes editar manualmente los precios en USD y EUR'
              }
            </div>
            {modoPrecios === 'automatico' && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-blue-600">
                <span className="bg-white px-2 py-1 rounded border">1 PEN = ${TASAS_CAMBIO.PEN_TO_USD} USD</span>
                <span className="bg-white px-2 py-1 rounded border">1 PEN = €{TASAS_CAMBIO.PEN_TO_EUR} EUR</span>
                <span className="text-blue-500 italic">• Tasas actualizadas</span>
              </div>
            )}
          </div>
          
          <form onSubmit={guardarProducto} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formularioProducto.nombre}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría *</Label>
                <Select
                  value={formularioProducto.categoria_id}
                  onValueChange={(value) => setFormularioProducto({ ...formularioProducto, categoria_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.filter(categoria => categoria.id).map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formularioProducto.descripcion}
                onChange={(e) => setFormularioProducto({ ...formularioProducto, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            {/* Sección de Precios */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-lg mb-4 flex items-center">
                💰 Configuración de Precios
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio_pen" className="flex items-center space-x-2">
                    <span>Precio (S/ PEN) *</span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Base</span>
                  </Label>
                  <Input
                    id="precio_pen"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formularioProducto.precio_pen}
                    onChange={(e) => {
                      const nuevoPrecioPen = e.target.value
                      let nuevosPrecios = { precio_pen: nuevoPrecioPen }
                      
                      // Solo calcular automáticamente si estamos en modo automático
                      if (modoPrecios === 'automatico') {
                        const preciosCalculados = calcularPreciosAutomaticos(nuevoPrecioPen)
                        nuevosPrecios = {
                          ...nuevosPrecios,
                          precio_usd: preciosCalculados.precio_usd,
                          precio_eur: preciosCalculados.precio_eur
                        } as any
                      }
                      
                      setFormularioProducto({ 
                        ...formularioProducto, 
                        ...nuevosPrecios
                      })
                    }}
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500">
                    <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mr-1"></span>
                    {modoPrecios === 'automatico' 
                      ? 'Al cambiar este precio, USD y EUR se actualizarán automáticamente'
                      : 'En modo manual, USD y EUR no se actualizarán automáticamente'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio_usd" className="flex items-center space-x-2">
                    <span>Precio (USD $)</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      modoPrecios === 'automatico' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-green-600 bg-green-50'
                    }`}>
                      {modoPrecios === 'automatico' ? 'Auto' : 'Manual'}
                    </span>
                  </Label>
                  <Input
                    id="precio_usd"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formularioProducto.precio_usd}
                    readOnly={modoPrecios === 'automatico'}
                    onChange={(e) => {
                      if (modoPrecios === 'manual') {
                        setFormularioProducto({ ...formularioProducto, precio_usd: e.target.value })
                      }
                    }}
                    className={modoPrecios === 'automatico' 
                      ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 cursor-not-allowed border-dashed"
                      : "focus:ring-2 focus:ring-green-500 border-green-300"
                    }
                    placeholder={modoPrecios === 'automatico' ? "Se calcula automáticamente desde PEN" : "0.00"}
                  />
                  <p className={`text-xs flex items-center ${
                    modoPrecios === 'automatico' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      modoPrecios === 'automatico' ? 'bg-blue-400' : 'bg-green-400'
                    }`}></span>
                    {modoPrecios === 'automatico' 
                      ? `Tasa: 1 PEN = $${TASAS_CAMBIO.PEN_TO_USD} USD`
                      : 'Precio personalizado - editable manualmente'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio_eur" className="flex items-center space-x-2">
                    <span>Precio (EUR €)</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      modoPrecios === 'automatico' 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-green-600 bg-green-50'
                    }`}>
                      {modoPrecios === 'automatico' ? 'Auto' : 'Manual'}
                    </span>
                  </Label>
                  <Input
                    id="precio_eur"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formularioProducto.precio_eur}
                    readOnly={modoPrecios === 'automatico'}
                    onChange={(e) => {
                      if (modoPrecios === 'manual') {
                        setFormularioProducto({ ...formularioProducto, precio_eur: e.target.value })
                      }
                    }}
                    className={modoPrecios === 'automatico' 
                      ? "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 cursor-not-allowed border-dashed"
                      : "focus:ring-2 focus:ring-green-500 border-green-300"
                    }
                    placeholder={modoPrecios === 'automatico' ? "Se calcula automáticamente desde PEN" : "0.00"}
                  />
                  <p className={`text-xs flex items-center ${
                    modoPrecios === 'automatico' ? 'text-blue-600' : 'text-green-600'
                  }`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                      modoPrecios === 'automatico' ? 'bg-blue-400' : 'bg-green-400'
                    }`}></span>
                    {modoPrecios === 'automatico' 
                      ? `Tasa: 1 PEN = €${TASAS_CAMBIO.PEN_TO_EUR} EUR`
                      : 'Precio personalizado - editable manualmente'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Resto del formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formularioProducto.stock}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <ImageUpload
                  onImageUploaded={(url) => setFormularioProducto({ ...formularioProducto, imagen: url })}
                  currentImages={formularioProducto.imagen ? [formularioProducto.imagen] : []}
                  maxImages={1}
                  maxSizeInMB={5}
                />
                <p className="text-xs text-stone-500 mt-2">
                  Puedes subir una imagen o usar una URL externa
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="destacado"
                  checked={formularioProducto.destacado}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, destacado: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="destacado">Producto destacado</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formularioProducto.activo}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, activo: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="activo">Producto activo</Label>
              </div>
            </div>

            {error && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAbierto(false)}
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : editandoProducto ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
