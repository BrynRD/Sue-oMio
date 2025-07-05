'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Database, 
  ShoppingBag, 
  Users, 
  CreditCard,
  Shield,
  Image as ImageIcon,
  Settings
} from 'lucide-react'
import Header from '@/components/Header'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message?: string
  duration?: number
}

export default function TestingPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [categorias, setCategorias] = useState([])

  const testSuites = [
    {
      name: 'APIs de Productos',
      tests: [
        { name: 'Obtener lista de productos', endpoint: '/api/productos' },
        { name: 'Obtener categorías', endpoint: '/api/categorias' },
        { name: 'Obtener producto específico', endpoint: '/api/productos/1' },
      ]
    },
    {
      name: 'APIs de Autenticación',
      tests: [
        { name: 'Login con credenciales válidas', endpoint: '/api/auth/login', method: 'POST', data: { email: 'admin@suenomio.com', password: 'admin123' } },
        { name: 'Registro de usuario', endpoint: '/api/auth/registro', method: 'POST', data: { nombre: 'Test', email: 'test@test.com', password: 'test123' } },
      ]
    },
    {
      name: 'APIs de Configuración',
      tests: [
        { name: 'Obtener tasas de cambio', endpoint: '/api/configuracion/tasas-cambio' },
        { name: 'Convertir precio', endpoint: '/api/configuracion/convertir-precio?precio=100&de=PEN&a=USD' },
      ]
    },
    {
      name: 'APIs de Dashboard (Admin)',
      tests: [
        { name: 'Estadísticas del dashboard', endpoint: '/api/dashboard/estadisticas' },
        { name: 'Productos más vendidos', endpoint: '/api/dashboard/productos-mas-vendidos' },
        { name: 'Pedidos recientes', endpoint: '/api/dashboard/pedidos-recientes' },
      ]
    }
  ]

  useEffect(() => {
    cargarCategorias()
  }, [])

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

  const runSingleTest = async (test: any): Promise<TestResult> => {
    const startTime = Date.now()
    
    try {
      const options: RequestInit = {
        method: test.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (test.data) {
        options.body = JSON.stringify(test.data)
      }

      const response = await fetch(test.endpoint, options)
      const duration = Date.now() - startTime
      
      if (response.ok) {
        const data = await response.json()
        return {
          name: test.name,
          status: 'success',
          message: `✅ ${response.status} - ${Object.keys(data).length} campos retornados`,
          duration
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        return {
          name: test.name,
          status: 'error',
          message: `❌ ${response.status} - ${errorData.error || response.statusText}`,
          duration
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name: test.name,
        status: 'error',
        message: `❌ Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        duration
      }
    }
  }

  const runAllTests = async () => {
    setRunning(true)
    setTests([])
    
    const allTests = testSuites.flatMap(suite => suite.tests)
    
    for (const test of allTests) {
      // Actualizar estado como pendiente
      setTests(prev => [...prev, { name: test.name, status: 'pending' }])
      
      // Ejecutar test
      const result = await runSingleTest(test)
      
      // Actualizar resultado
      setTests(prev => prev.map(t => 
        t.name === test.name ? result : t
      ))
      
      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Éxito</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'pending':
        return <Badge variant="secondary">Ejecutando...</Badge>
    }
  }

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length
  const totalTests = tests.length

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-stone-800 mb-2">Testing Suite</h1>
          <p className="text-stone-600">Validación completa de APIs y funcionalidades del sistema</p>
        </div>

        {/* Estadísticas de Tests */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Total Tests</p>
                  <p className="text-2xl font-light text-stone-800">{totalTests}</p>
                </div>
                <Database className="h-8 w-8 text-stone-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Exitosos</p>
                  <p className="text-2xl font-light text-green-600">{successCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Fallidos</p>
                  <p className="text-2xl font-light text-red-600">{errorCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-600">Cobertura</p>
                  <p className="text-2xl font-light text-stone-800">
                    {totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0}%
                  </p>
                </div>
                <Shield className="h-8 w-8 text-stone-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <div className="mb-8">
          <Button 
            onClick={runAllTests} 
            disabled={running}
            className="bg-stone-800 text-white hover:bg-stone-700"
          >
            {running ? 'Ejecutando Tests...' : 'Ejecutar Todos los Tests'}
          </Button>
        </div>

        {/* Resultados por Suite */}
        <div className="space-y-6">
          {testSuites.map((suite, suiteIndex) => (
            <Card key={suiteIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {suite.name === 'APIs de Productos' && <ShoppingBag className="h-5 w-5" />}
                  {suite.name === 'APIs de Autenticación' && <Users className="h-5 w-5" />}
                  {suite.name === 'APIs de Configuración' && <Settings className="h-5 w-5" />}
                  {suite.name === 'APIs de Dashboard (Admin)' && <Shield className="h-5 w-5" />}
                  {suite.name}
                </CardTitle>
                <CardDescription>
                  {suite.tests.length} tests en esta suite
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suite.tests.map((test, testIndex) => {
                    const result = tests.find(t => t.name === test.name)
                    return (
                      <div key={testIndex} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {result ? getStatusIcon(result.status) : <div className="h-4 w-4" />}
                          <span className="font-medium text-stone-700">{test.name}</span>
                          <code className="text-xs bg-stone-200 px-2 py-1 rounded text-stone-600">
                            {test.method || 'GET'} {test.endpoint}
                          </code>
                        </div>
                        <div className="flex items-center gap-3">
                          {result?.duration && (
                            <span className="text-xs text-stone-500">{result.duration}ms</span>
                          )}
                          {result && getStatusBadge(result.status)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resultados Detallados */}
        {tests.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Resultados Detallados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tests.map((test, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-stone-50 rounded">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="font-medium text-stone-700">{test.name}</div>
                      {test.message && (
                        <div className="text-sm text-stone-600 mt-1">{test.message}</div>
                      )}
                    </div>
                    {test.duration && (
                      <div className="text-xs text-stone-500">{test.duration}ms</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Alert>
            <ImageIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Funcionalidades Principales:</strong><br />
              • Sistema de autenticación JWT<br />
              • Gestión completa de productos<br />
              • Multi-moneda con conversión automática<br />
              • Panel administrativo avanzado<br />
              • Carrito de compras persistente<br />
              • Proceso de checkout integrado
            </AlertDescription>
          </Alert>

          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              <strong>Integraciones:</strong><br />
              • Culqi para procesamiento de pagos<br />
              • Subida y gestión de imágenes<br />
              • Sistema de notificaciones<br />
              • Reportes y estadísticas<br />
              • Gestión de inventario<br />
              • Sistema de envíos
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
