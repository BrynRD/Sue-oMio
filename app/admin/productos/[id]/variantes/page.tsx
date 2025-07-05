'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Edit, Plus, ArrowLeft, Palette, Ruler, Package, AlertCircle, Image as ImageIcon, Copy, Zap } from 'lucide-react'
import Header from '@/components/Header'
import SimpleImageUpload from '@/components/SimpleImageUpload'

interface Variante {
  id: number
  color: string
  talla: string
  stock: number
  sku?: string
  imagen_url?: string
  activo: boolean
}

interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio_pen: number
  categoria_nombre: string
}

export default function VariantesProductoPage() {
  const params = useParams()
  const router = useRouter()
  const { estado } = useAuth()
  const { toast } = useToast()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [variantes, setVariantes] = useState<Variante[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [varianteEditando, setVarianteEditando] = useState<Variante | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [formulario, setFormulario] = useState({
    color: '',
    talla: '',
    stock: 0,
    sku: '',
    imagen_url: ''
  })

  // Estados adicionales para la UX mejorada
  const [modoCreacionRapida, setModoCreacionRapida] = useState(false)
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<string[]>([])
  const [colorCreacionRapida, setColorCreacionRapida] = useState('')
  const [imagenCreacionRapida, setImagenCreacionRapida] = useState('')
  const [stockCreacionRapida, setStockCreacionRapida] = useState(0)

  const coloresDisponibles = [
    'Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Rosa', 'Morado', 'Naranja', 'Beige', 'Marrón'
  ]

  const tallasDisponibles = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'
  ]

  useEffect(() => {
    if (estado.cargando) return

    if (!estado.autenticado || estado.usuario?.rol !== 'admin') {
      router.push('/login')
      return
    }
    
    cargarDatos()
  }, [params.id, estado])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError('')
      
      // Cargar categorías
      const responseCategorias = await fetch('/api/categorias')
      if (responseCategorias.ok) {
        const dataCategorias = await responseCategorias.json()
        setCategorias(Array.isArray(dataCategorias) ? dataCategorias : [])
      }
      
      // Cargar información del producto
      const responseProducto = await fetch(`/api/productos/${params.id}`)
      if (responseProducto.ok) {
        const dataProducto = await responseProducto.json()
        if (dataProducto.success) {
          setProducto(dataProducto.data)
        } else {
          setError('Producto no encontrado')
          return
        }
      } else {
        setError('Error al cargar el producto')
        return
      }

      // Cargar variantes del producto  
      try {
        const responseVariantes = await fetch(`/api/productos/${params.id}/variantes`)
        console.log('Response variantes status:', responseVariantes.status)
        
        if (responseVariantes.ok) {
          const dataVariantes = await responseVariantes.json()
          console.log('Data variantes:', dataVariantes)
          setVariantes(dataVariantes.success ? dataVariantes.data || [] : [])
        } else {
          const errorText = await responseVariantes.text()
          console.error('Error response:', errorText)
          setError(`Error al cargar variantes (${responseVariantes.status}): ${errorText}`)
        }
      } catch (variantesError) {
        console.error('Error variantes:', variantesError)
        setError(`Error de conexión al cargar variantes: ${(variantesError as Error).message}`)
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar los datos')
    } finally {
      setCargando(false)
    }
  }

  const abrirModal = (variante?: Variante) => {
    if (variante) {
      setVarianteEditando(variante)
      setFormulario({
        color: variante.color,
        talla: variante.talla,
        stock: variante.stock,
        sku: variante.sku || '',
        imagen_url: variante.imagen_url || ''
      })
    } else {
      setVarianteEditando(null)
      setFormulario({
        color: '',
        talla: '',
        stock: 0,
        sku: '',
        imagen_url: ''
      })
    }
    setModalAbierto(true)
  }

  // Función para duplicar una variante
  const duplicarVariante = (variante: Variante) => {
    setFormulario({
      color: variante.color,
      talla: '',
      stock: variante.stock,
      sku: '',
      imagen_url: variante.imagen_url || ''
    })
    setVarianteEditando(null)
    setModalAbierto(true)
  }

  const guardarVariante = async () => {
    try {
      setGuardando(true)
      setError('')

      const url = varianteEditando 
        ? `/api/productos/${params.id}/variantes/${varianteEditando.id}`
        : `/api/productos/${params.id}/variantes`
      
      const method = varianteEditando ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${estado.token}`
        },
        body: JSON.stringify({
          ...formulario,
          producto_id: params.id
        })
      })

      if (response.ok) {
        await cargarDatos()
        // Auto-sincronizar stock después de crear/editar (silencioso)
        await sincronizarStock(true)
        setModalAbierto(false)
        toast({
          title: "Éxito",
          description: varianteEditando ? 'Variante actualizada correctamente' : 'Variante creada correctamente',
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || 'Error al guardar la variante',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: 'Error al guardar la variante',
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  // Función para crear múltiples variantes por color
  const crearVariantesPorColor = async () => {
    if (!colorCreacionRapida || tallasSeleccionadas.length === 0) {
      toast({
        title: "Error",
        description: 'Selecciona un color y al menos una talla',
        variant: "destructive",
      })
      return
    }

    setGuardando(true)
    let errores = 0
    let exitos = 0

    for (const talla of tallasSeleccionadas) {
      try {
        const response = await fetch(`/api/productos/${params.id}/variantes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${estado.token}`
          },
          body: JSON.stringify({
            color: colorCreacionRapida,
            talla: talla,
            stock: stockCreacionRapida,
            sku: `${params.id}-${colorCreacionRapida.toLowerCase()}-${talla.toLowerCase()}`,
            imagen_url: imagenCreacionRapida
          })
        })

        if (response.ok) {
          exitos++
        } else {
          errores++
        }
      } catch (error) {
        errores++
      }
    }

    setGuardando(false)
    await cargarDatos()
    
    if (exitos > 0) {
      // Auto-sincronizar stock después de crear variantes múltiples (silencioso)
      await sincronizarStock(true)
      toast({
        title: "Variantes creadas",
        description: `Se crearon ${exitos} variantes correctamente${errores > 0 ? ` (${errores} errores)` : ''}`,
      })
    }

    // Reset del formulario de creación rápida
    setModoCreacionRapida(false)
    setTallasSeleccionadas([])
    setColorCreacionRapida('')
    setImagenCreacionRapida('')
    setStockCreacionRapida(0)
  }

  const eliminarVariante = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta variante? Esta acción no se puede deshacer.')) return

    try {
      const response = await fetch(`/api/productos/${params.id}/variantes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${estado.token}`
        }
      })

      if (response.ok) {
        await cargarDatos()
        // Auto-sincronizar stock después de eliminar (silencioso)
        await sincronizarStock(true)
        toast({
          title: "Éxito",
          description: 'Variante eliminada correctamente',
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || 'Error al eliminar la variante',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: 'Error al eliminar la variante',
        variant: "destructive",
      })
    }
  }

  const cambiarEstadoVariante = async (id: number, activo: boolean) => {
    try {
      const response = await fetch(`/api/productos/${params.id}/variantes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${estado.token}`
        },
        body: JSON.stringify({ activo })
      })

      if (response.ok) {
        await cargarDatos()
        // Auto-sincronizar stock después de cambiar estado (silencioso)
        await sincronizarStock(true)
        toast({
          title: "Estado actualizado",
          description: `La variante ha sido ${activo ? 'activada' : 'desactivada'}`,
        })
      } else {
        toast({
          title: "Error",
          description: 'Error al cambiar el estado de la variante',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: 'Error al cambiar el estado de la variante',
        variant: "destructive",
      })
    }
  }

  const sincronizarStock = async (silencioso = false) => {
    try {
      if (!silencioso) setGuardando(true)
      const response = await fetch(`/api/productos/${params.id}/sincronizar-stock`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${estado.token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (!silencioso) {
          toast({
            title: "Stock sincronizado",
            description: data.data.mensaje,
          })
          // Solo recargar datos si no es silencioso
          await cargarDatos()
        }
      } else {
        const errorData = await response.json()
        if (!silencioso) {
          toast({
            title: "Error",
            description: errorData.error || 'Error al sincronizar stock',
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error('Error:', error)
      if (!silencioso) {
        toast({
          title: "Error",
          description: 'Error al sincronizar stock',
          variant: "destructive",
        })
      }
    } finally {
      if (!silencioso) setGuardando(false)
    }
  }

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
            <p className="text-stone-600">Cargando variantes...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !producto) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header categorias={categorias} />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-light text-stone-800 mb-2">{error}</h1>
          <Button onClick={() => router.push('/admin/productos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Productos
          </Button>
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
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/productos')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Productos
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-stone-800">
                Gestión de Variantes
              </h1>
              {producto && (
                <div className="mt-2">
                  <p className="text-stone-600">
                    Producto: <span className="font-medium">{producto.nombre}</span>
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-stone-500">
                      Stock producto: <span className="font-medium">{producto.stock || 0}</span>
                    </span>
                    <span className="text-sm text-stone-500">
                      Stock variantes: <span className="font-medium">{variantes.reduce((total, v) => total + (v.stock || 0), 0)}</span>
                    </span>
                    {(producto.stock || 0) !== variantes.reduce((total, v) => total + (v.stock || 0), 0) && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        ⚠️ Stock desincronizado
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setModoCreacionRapida(true)}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Zap className="h-4 w-4 mr-2" />
                Creación Rápida
              </Button>
              <Button 
                onClick={sincronizarStock}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                disabled={guardando}
              >
                <Package className="h-4 w-4 mr-2" />
                Sincronizar Stock
              </Button>
              <Button 
                onClick={() => abrirModal()}
                className="bg-stone-800 text-white hover:bg-stone-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Variante
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-stone-600">Total Variantes</p>
                  <p className="text-2xl font-light text-stone-800">{variantes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Palette className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-stone-600">Colores</p>
                  <p className="text-2xl font-light text-stone-800">
                    {new Set(variantes.map(v => v.color).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ruler className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-stone-600">Tallas</p>
                  <p className="text-2xl font-light text-stone-800">
                    {new Set(variantes.map(v => v.talla).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-stone-600">Stock del Producto</p>
                    <p className="text-2xl font-light text-stone-800">
                      {producto?.stock || 0}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-600">Stock Variantes</p>
                  <p className={`text-lg font-medium ${
                    (producto?.stock || 0) === variantes.reduce((total, v) => total + (v.stock || 0), 0)
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {variantes.reduce((total, v) => total + (v.stock || 0), 0)}
                  </p>
                  {(producto?.stock || 0) !== variantes.reduce((total, v) => total + (v.stock || 0), 0) && (
                    <p className="text-xs text-orange-600">⚠️ Desincronizado</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vista Agrupada por Colores (solo si hay variantes) */}
        {variantes.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-light">Resumen por Colores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {Array.from(new Set(variantes.map(v => v.color).filter(Boolean))).map(color => {
                  const variantesDelColor = variantes.filter(v => v.color === color)
                  const stockTotal = variantesDelColor.reduce((sum, v) => sum + (v.stock || 0), 0)
                  
                  return (
                    <div key={color} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-stone-300"
                          style={{
                            backgroundColor: color === 'Negro' ? '#000000' :
                                           color === 'Blanco' ? '#ffffff' :
                                           color === 'Gris' ? '#6b7280' :
                                           color === 'Azul' ? '#3b82f6' :
                                           color === 'Rojo' ? '#ef4444' :
                                           color === 'Verde' ? '#22c55e' :
                                           color === 'Amarillo' ? '#eab308' :
                                           color === 'Rosa' ? '#ec4899' :
                                           color === 'Morado' ? '#a855f7' :
                                           color === 'Naranja' ? '#f97316' :
                                           color === 'Beige' ? '#d6d3d1' :
                                           color === 'Marrón' ? '#a3a3a3' :
                                           '#6b7280'
                          }}
                        />
                        <div>
                          <h4 className="font-medium">{color}</h4>
                          <p className="text-sm text-stone-600">
                            {variantesDelColor.length} talla{variantesDelColor.length !== 1 ? 's' : ''}: {' '}
                            {variantesDelColor.map(v => v.talla).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-lg">{stockTotal}</p>
                        <p className="text-sm text-stone-600">unidades</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de Variantes */}
        <Card>
          <CardHeader>
            <CardTitle className="font-light">Variantes del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            {variantes.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-800 mb-2">
                  No hay variantes
                </h3>
                <p className="text-stone-600 mb-6 max-w-md mx-auto">
                  Las variantes te permiten crear diferentes combinaciones de <strong>color + talla</strong> 
                  con stock específico para cada una. Cada variante puede tener su propia imagen.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => setModoCreacionRapida(true)}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Creación Rápida
                  </Button>
                  <Button onClick={() => abrirModal()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Variante
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imagen</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Talla</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variantes.map((variante) => (
                      <TableRow key={variante.id}>
                        <TableCell>
                          <div className="w-12 h-12 relative">
                            {variante.imagen_url ? (
                              <img 
                                src={variante.imagen_url} 
                                alt={`${variante.color}`}
                                className="w-full h-full object-cover rounded-lg border border-stone-200"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (placeholder) placeholder.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-full h-full rounded-lg border border-stone-200 bg-stone-100 flex items-center justify-center ${variante.imagen_url ? 'hidden' : 'flex'}`}
                              style={{display: variante.imagen_url ? 'none' : 'flex'}}
                            >
                              <ImageIcon className="w-4 h-4 text-stone-400" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-5 h-5 rounded-full border-2 border-stone-300 shadow-sm"
                              style={{ 
                                backgroundColor: variante.color === 'Blanco' ? '#ffffff' :
                                               variante.color === 'Negro' ? '#000000' :
                                               variante.color === 'Gris' ? '#6b7280' :
                                               variante.color === 'Azul' ? '#3b82f6' :
                                               variante.color === 'Rojo' ? '#ef4444' :
                                               variante.color === 'Verde' ? '#22c55e' :
                                               variante.color === 'Amarillo' ? '#eab308' :
                                               variante.color === 'Rosa' ? '#ec4899' :
                                               variante.color === 'Morado' ? '#a855f7' :
                                               variante.color === 'Naranja' ? '#f97316' :
                                               variante.color === 'Beige' ? '#d6d3d1' :
                                               variante.color === 'Marrón' ? '#92400e' :
                                               '#6b7280',
                                borderColor: variante.color === 'Blanco' ? '#d1d5db' : 'transparent'
                              }}
                            />
                            <span className="font-medium">{variante.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{variante.talla}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${(variante.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {variante.stock || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-stone-100 px-2 py-1 rounded">
                            {variante.sku || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variante.activo ? 'default' : 'secondary'}>
                            {variante.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicarVariante(variante)}
                              className="text-blue-600 hover:text-blue-800 border-blue-300 hover:bg-blue-50"
                              title="Duplicar: crea una nueva variante con el mismo color e imagen, solo cambias la talla"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => abrirModal(variante)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => eliminarVariante(variante.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Modal para crear/editar variante */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {varianteEditando ? 'Editar Variante' : 
               (formulario.color && !varianteEditando ? `Duplicando variante ${formulario.color}` : 'Nueva Variante')}
            </DialogTitle>
            {!varianteEditando && formulario.color && (
              <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                💡 Color e imagen ya seleccionados, solo elige una talla diferente
              </p>
            )}
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color" className="text-sm font-medium">Color *</Label>
                <Select 
                  value={formulario.color} 
                  onValueChange={(value) => setFormulario({...formulario, color: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar color" />
                  </SelectTrigger>
                  <SelectContent>
                    {coloresDisponibles.map(color => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-stone-300"
                            style={{ 
                              backgroundColor: color === 'Blanco' ? '#ffffff' :
                                             color === 'Negro' ? '#000000' :
                                             color === 'Gris' ? '#6b7280' :
                                             color === 'Azul' ? '#3b82f6' :
                                             color === 'Rojo' ? '#ef4444' :
                                             color === 'Verde' ? '#22c55e' :
                                             color === 'Amarillo' ? '#eab308' :
                                             color === 'Rosa' ? '#ec4899' :
                                             color === 'Morado' ? '#a855f7' :
                                             color === 'Naranja' ? '#f97316' :
                                             color === 'Beige' ? '#d6d3d1' :
                                             color === 'Marrón' ? '#92400e' :
                                             '#6b7280'
                            }}
                          />
                          <span>{color}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="talla" className="text-sm font-medium">Talla *</Label>
                <Select 
                  value={formulario.talla} 
                  onValueChange={(value) => setFormulario({...formulario, talla: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar talla" />
                  </SelectTrigger>
                  <SelectContent>
                    {tallasDisponibles.map(talla => (
                      <SelectItem key={talla} value={talla}>
                        {talla}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-medium">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formulario.stock}
                  onChange={(e) => setFormulario({...formulario, stock: parseInt(e.target.value) || 0})}
                  placeholder="Cantidad disponible"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-sm font-medium">SKU (opcional)</Label>
                <Input
                  id="sku"
                  value={formulario.sku}
                  onChange={(e) => setFormulario({...formulario, sku: e.target.value})}
                  placeholder="Código único del producto"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Imagen de esta variante (opcional)</Label>
              <SimpleImageUpload
                value={formulario.imagen_url}
                onChange={(url) => setFormulario({...formulario, imagen_url: url})}
                label=""
                className="w-full"
                disabled={guardando}
              />
              <p className="text-xs text-stone-500">
                💡 Sube una imagen específica para esta combinación color + talla
              </p>
            </div>
            
            <div className="flex space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAbierto(false)}
                className="flex-1"
                disabled={guardando}
              >
                Cancelar
              </Button>
              <Button
                onClick={guardarVariante}
                disabled={guardando || !formulario.color || !formulario.talla}
                className="flex-1 bg-stone-800 text-white hover:bg-stone-900"
              >
                {guardando ? 'Guardando...' : (varianteEditando ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Creación Rápida */}
      <Dialog open={modoCreacionRapida} onOpenChange={setModoCreacionRapida}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-green-600" />
              Creación Rápida de Variantes
            </DialogTitle>
            <p className="text-stone-600 text-sm">
              Crea múltiples variantes del mismo color con diferentes tallas de una vez
            </p>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Color */}
            <div>
              <Label className="text-base font-medium mb-3 block">1. Selecciona el Color</Label>
              <Select
                value={colorCreacionRapida}
                onValueChange={setColorCreacionRapida}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un color..." />
                </SelectTrigger>
                <SelectContent>
                  {coloresDisponibles.map((color) => (
                    <SelectItem key={color} value={color}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-stone-300"
                          style={{
                            backgroundColor: color === 'Negro' ? '#000000' :
                                           color === 'Blanco' ? '#ffffff' :
                                           color === 'Gris' ? '#6b7280' :
                                           color === 'Azul' ? '#3b82f6' :
                                           color === 'Rojo' ? '#ef4444' :
                                           color === 'Verde' ? '#22c55e' :
                                           color === 'Amarillo' ? '#eab308' :
                                           color === 'Rosa' ? '#ec4899' :
                                           color === 'Morado' ? '#a855f7' :
                                           color === 'Naranja' ? '#f97316' :
                                           color === 'Beige' ? '#d6d3d1' :
                                           color === 'Marrón' ? '#a3a3a3' :
                                           '#6b7280'
                          }}
                        />
                        <span>{color}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tallas */}
            <div>
              <Label className="text-base font-medium mb-3 block">2. Selecciona las Tallas</Label>
              <div className="grid grid-cols-4 gap-2">
                {tallasDisponibles.map((talla) => (
                  <Button
                    key={talla}
                    type="button"
                    variant={tallasSeleccionadas.includes(talla) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (tallasSeleccionadas.includes(talla)) {
                        setTallasSeleccionadas(tallasSeleccionadas.filter(t => t !== talla))
                      } else {
                        setTallasSeleccionadas([...tallasSeleccionadas, talla])
                      }
                    }}
                    className={tallasSeleccionadas.includes(talla) 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "hover:bg-green-50 border-green-300"
                    }
                  >
                    {talla}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Seleccionadas: {tallasSeleccionadas.length} tallas
              </p>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock-rapido">Stock por Variante</Label>
                <Input
                  id="stock-rapido"
                  type="number"
                  min="0"
                  value={stockCreacionRapida}
                  onChange={(e) => setStockCreacionRapida(parseInt(e.target.value) || 0)}
                  placeholder="Ej: 10"
                />
              </div>
            </div>

            {/* Imagen */}
            <div>
              <Label className="text-base font-medium mb-3 block">3. Imagen (opcional)</Label>
              <SimpleImageUpload
                value={imagenCreacionRapida}
                onChange={setImagenCreacionRapida}
                label="Imagen para todas las variantes de este color"
                className="w-full"
                disabled={guardando}
              />
              <p className="text-xs text-stone-500 mt-2">
                Esta imagen se usará para todas las tallas del color seleccionado
              </p>
            </div>

            {/* Preview */}
            {colorCreacionRapida && tallasSeleccionadas.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Vista Previa</h4>
                <p className="text-sm text-blue-700">
                  Se crearán <strong>{tallasSeleccionadas.length} variantes</strong> del color{' '}
                  <strong>{colorCreacionRapida}</strong> con {stockCreacionRapida} unidades cada una:
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tallasSeleccionadas.map(talla => (
                    <Badge key={talla} variant="secondary" className="text-xs">
                      {colorCreacionRapida} - {talla}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModoCreacionRapida(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={crearVariantesPorColor}
                disabled={guardando || !colorCreacionRapida || tallasSeleccionadas.length === 0}
                className="flex-1 bg-green-600 text-white hover:bg-green-700"
              >
                {guardando ? 'Creando...' : `Crear ${tallasSeleccionadas.length} Variantes`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
