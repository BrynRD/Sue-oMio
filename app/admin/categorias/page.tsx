'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  AlertCircle,
  Search,
  ArrowUpDown
} from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'

interface Categoria {
  id: number
  nombre: string
  descripcion: string
  imagen: string | null
  activo: number
  orden: number
  fecha_creacion: string
  productos_count?: number
}

export default function AdminCategoriasPage() {
  const { estado } = useAuth()
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoCategoria, setEditandoCategoria] = useState<Categoria | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [formularioCategoria, setFormularioCategoria] = useState({
    nombre: '',
    descripcion: '',
    imagen: '',
    activo: true,
    orden: '1'
  })

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

    cargarCategorias()
  }, [estado, router])

  const cargarCategorias = async () => {
    setCargando(true)
    try {
      const response = await fetch('/api/categorias?incluir_productos=true', {
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCategorias(Array.isArray(data) ? data : [])
      } else {
        setError('Error al cargar categorías')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al cargar categorías')
    } finally {
      setCargando(false)
    }
  }

  const abrirModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditandoCategoria(categoria)
      setFormularioCategoria({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion,
        imagen: categoria.imagen || '',
        activo: categoria.activo === 1,
        orden: categoria.orden.toString()
      })
    } else {
      setEditandoCategoria(null)
      setFormularioCategoria({
        nombre: '',
        descripcion: '',
        imagen: '',
        activo: true,
        orden: '1'
      })
    }
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditandoCategoria(null)
    setError('')
  }

  const guardarCategoria = async () => {
    if (!formularioCategoria.nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    setGuardando(true)
    setError('')

    try {
      const url = editandoCategoria 
        ? `/api/categorias/${editandoCategoria.id}`
        : '/api/categorias'
      
      const method = editandoCategoria ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${estado.token}`,
        },
        body: JSON.stringify({
          nombre: formularioCategoria.nombre.trim(),
          descripcion: formularioCategoria.descripcion.trim(),
          imagen: formularioCategoria.imagen.trim() || null,
          activo: formularioCategoria.activo,
          orden: parseInt(formularioCategoria.orden) || 1
        }),
      })

      if (response.ok) {
        await cargarCategorias()
        cerrarModal()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al guardar categoría')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarCategoria = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${nombre}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${estado.token}`,
        },
      })

      if (response.ok) {
        await cargarCategorias()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al eliminar categoría')
    }
  }

  const toggleActivo = async (categoria: Categoria) => {
    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${estado.token}`,
        },
        body: JSON.stringify({
          ...categoria,
          activo: categoria.activo === 1 ? 0 : 1
        }),
      })

      if (response.ok) {
        await cargarCategorias()
      } else {
        setError('Error al actualizar categoría')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al actualizar categoría')
    }
  }

  const categoriasFiltradas = categorias.filter(categoria =>
    categoria.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    categoria.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  )

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
        <Header categorias={[]} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800 mx-auto mb-4"></div>
            <p className="text-stone-600">Cargando categorías...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de la página */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-stone-800">Gestión de Categorías</h1>
              <p className="text-stone-600 mt-2">Administra las categorías de productos de tu tienda</p>
            </div>
            <Button onClick={() => abrirModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar categorías..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de categorías */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Categorías ({categoriasFiltradas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imagen</TableHead>
                  <TableHead>
                    <Button variant="ghost" className="h-auto p-0 font-medium">
                      Nombre
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriasFiltradas.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell>
                      <div className="w-12 h-12 bg-stone-200 rounded-lg flex-shrink-0">
                        {categoria.imagen ? (
                          <img
                            src={categoria.imagen}
                            alt={categoria.nombre}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full rounded-lg border border-stone-200 bg-stone-100 flex items-center justify-center ${categoria.imagen ? 'hidden' : 'flex'}`}
                          style={{display: categoria.imagen ? 'none' : 'flex'}}
                        >
                          <Package className="w-4 h-4 text-stone-400" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {categoria.nombre}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {categoria.descripcion}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoria.productos_count || 0} productos
                      </Badge>
                    </TableCell>
                    <TableCell>{categoria.orden}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={categoria.activo === 1}
                          onCheckedChange={() => toggleActivo(categoria)}
                        />
                        <Badge variant={categoria.activo === 1 ? 'default' : 'secondary'}>
                          {categoria.activo === 1 ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirModal(categoria)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarCategoria(categoria.id, categoria.nombre)}
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

            {categoriasFiltradas.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500">
                  {busqueda ? 'No se encontraron categorías' : 'No hay categorías registradas'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de categoría */}
        <Dialog open={modalAbierto} onOpenChange={cerrarModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <DialogDescription>
                {editandoCategoria 
                  ? 'Modifica los datos de la categoría seleccionada'
                  : 'Completa la información para crear una nueva categoría'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Ropa Deportiva"
                  value={formularioCategoria.nombre}
                  onChange={(e) => setFormularioCategoria({ ...formularioCategoria, nombre: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Descripción de la categoría..."
                  value={formularioCategoria.descripcion}
                  onChange={(e) => setFormularioCategoria({ ...formularioCategoria, descripcion: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Imagen de la Categoría</Label>
                <ImageUpload
                  onImageUploaded={(url) => setFormularioCategoria({ ...formularioCategoria, imagen: url })}
                  currentImages={formularioCategoria.imagen ? [formularioCategoria.imagen] : []}
                  maxImages={1}
                  maxSizeInMB={5}
                />
                <p className="text-xs text-stone-500">
                  Esta imagen se mostrará en la página principal y en el catálogo
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orden">Orden</Label>
                  <Input
                    id="orden"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formularioCategoria.orden}
                    onChange={(e) => setFormularioCategoria({ ...formularioCategoria, orden: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      checked={formularioCategoria.activo}
                      onCheckedChange={(checked) => setFormularioCategoria({ ...formularioCategoria, activo: checked })}
                    />
                    <span className="text-sm">
                      {formularioCategoria.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button onClick={guardarCategoria} disabled={guardando}>
                {guardando ? 'Guardando...' : (editandoCategoria ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
