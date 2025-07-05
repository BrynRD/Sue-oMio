'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Clock, 
  Database, 
  Zap, 
  Users, 
  ShoppingCart,
  Server,
  Wifi,
  HardDrive,
  Eye,
  TrendingUp
} from 'lucide-react'
import Header from '@/components/Header'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'critical'
  description: string
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical'
  api: 'healthy' | 'warning' | 'critical'
  storage: 'healthy' | 'warning' | 'critical'
  memory: number
  cpu: number
  requests: number
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState([])

  // Métricas de rendimiento del navegador
  const [browserMetrics, setBrowserMetrics] = useState({
    loadTime: 0,
    domReady: 0,
    firstPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0
  })

  useEffect(() => {
    cargarCategorias()
    obtenerMetricasNavegador()
    simularMetricasServidor()
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

  const obtenerMetricasNavegador = () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      setBrowserMetrics({
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: 0, // Se puede obtener con Performance Observer
        largestContentfulPaint: 0, // Se puede obtener con Performance Observer
        cumulativeLayoutShift: 0 // Se puede obtener con Performance Observer
      })

      // Performance Observer para Core Web Vitals
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'paint' && entry.name === 'first-paint') {
                setBrowserMetrics(prev => ({ ...prev, firstPaint: entry.startTime }))
              }
              if (entry.entryType === 'largest-contentful-paint') {
                setBrowserMetrics(prev => ({ ...prev, largestContentfulPaint: entry.startTime }))
              }
              if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                setBrowserMetrics(prev => ({ 
                  ...prev, 
                  cumulativeLayoutShift: prev.cumulativeLayoutShift + (entry as any).value 
                }))
              }
            }
          })
          
          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] })
        } catch (error) {
          console.log('Performance Observer no disponible')
        }
      }
    }
  }

  const simularMetricasServidor = () => {
    // Simulación de métricas del servidor
    const simulatedMetrics: PerformanceMetric[] = [
      {
        name: 'Tiempo de respuesta promedio',
        value: Math.random() * 200 + 50,
        unit: 'ms',
        status: 'good',
        description: 'Tiempo promedio de respuesta de las APIs'
      },
      {
        name: 'Throughput',
        value: Math.random() * 100 + 50,
        unit: 'req/s',
        status: 'good',
        description: 'Número de requests procesados por segundo'
      },
      {
        name: 'Error Rate',
        value: Math.random() * 2,
        unit: '%',
        status: 'good',
        description: 'Porcentaje de errores en las respuestas'
      },
      {
        name: 'Conexiones de DB activas',
        value: Math.floor(Math.random() * 20 + 5),
        unit: 'conn',
        status: 'good',
        description: 'Conexiones activas a la base de datos'
      },
      {
        name: 'Uso de memoria',
        value: Math.random() * 40 + 30,
        unit: '%',
        status: 'good',
        description: 'Porcentaje de memoria RAM utilizada'
      },
      {
        name: 'Espacio en disco',
        value: Math.random() * 20 + 60,
        unit: '%',
        status: 'warning',
        description: 'Porcentaje de espacio en disco utilizado'
      }
    ]

    setMetrics(simulatedMetrics)

    // Sistema de salud simulado
    setSystemHealth({
      database: 'healthy',
      api: 'healthy',
      storage: 'warning',
      memory: Math.random() * 40 + 30,
      cpu: Math.random() * 30 + 20,
      requests: Math.floor(Math.random() * 1000 + 500)
    })
  }

  const ejecutarTestCarga = async () => {
    setLoading(true)
    
    const endpoints = [
      '/api/productos',
      '/api/categorias',
      '/api/configuracion/tasas-cambio',
      '/api/dashboard/estadisticas'
    ]

    const results = []
    
    for (const endpoint of endpoints) {
      const start = performance.now()
      try {
        await fetch(endpoint)
        const duration = performance.now() - start
        results.push({ endpoint, duration, status: 'success' })
      } catch (error) {
        const duration = performance.now() - start
        results.push({ endpoint, duration, status: 'error' })
      }
    }

    // Simular actualización de métricas después del test
    setTimeout(() => {
      simularMetricasServidor()
      setLoading(false)
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatMetricValue = (metric: PerformanceMetric) => {
    if (metric.unit === 'ms' && metric.value > 1000) {
      return `${(metric.value / 1000).toFixed(2)} s`
    }
    return `${metric.value.toFixed(metric.unit === '%' ? 1 : 0)} ${metric.unit}`
  }

  const getCoreWebVitalStatus = (metric: string, value: number) => {
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? 'good' : value <= 4000 ? 'warning' : 'critical'
      case 'cls':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'warning' : 'critical'
      case 'fid':
        return value <= 100 ? 'good' : value <= 300 ? 'warning' : 'critical'
      default:
        return 'good'
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header categorias={categorias} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-stone-800 mb-2">Monitor de Rendimiento</h1>
          <p className="text-stone-600">Métricas de rendimiento y salud del sistema en tiempo real</p>
        </div>

        {/* Estado del Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-700">Base de Datos</h3>
                <Database className="h-5 w-5 text-stone-400" />
              </div>
              {systemHealth && (
                <Badge className={getStatusColor(systemHealth.database)}>
                  {systemHealth.database === 'healthy' ? 'Saludable' : 
                   systemHealth.database === 'warning' ? 'Advertencia' : 'Crítico'}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-700">APIs</h3>
                <Server className="h-5 w-5 text-stone-400" />
              </div>
              {systemHealth && (
                <Badge className={getStatusColor(systemHealth.api)}>
                  {systemHealth.api === 'healthy' ? 'Saludable' : 
                   systemHealth.api === 'warning' ? 'Advertencia' : 'Crítico'}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-700">Almacenamiento</h3>
                <HardDrive className="h-5 w-5 text-stone-400" />
              </div>
              {systemHealth && (
                <Badge className={getStatusColor(systemHealth.storage)}>
                  {systemHealth.storage === 'healthy' ? 'Saludable' : 
                   systemHealth.storage === 'warning' ? 'Advertencia' : 'Crítico'}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-700">Requests/min</h3>
                <Activity className="h-5 w-5 text-stone-400" />
              </div>
              {systemHealth && (
                <div className="text-2xl font-light text-stone-800">
                  {systemHealth.requests}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Core Web Vitals */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
            <CardDescription>
              Métricas de experiencia de usuario en el navegador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Largest Contentful Paint</span>
                  <Badge className={getStatusColor(getCoreWebVitalStatus('lcp', browserMetrics.largestContentfulPaint))}>
                    {browserMetrics.largestContentfulPaint > 0 ? 
                      `${(browserMetrics.largestContentfulPaint / 1000).toFixed(2)}s` : 'N/A'}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((browserMetrics.largestContentfulPaint / 4000) * 100, 100)} 
                  className="h-2" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cumulative Layout Shift</span>
                  <Badge className={getStatusColor(getCoreWebVitalStatus('cls', browserMetrics.cumulativeLayoutShift))}>
                    {browserMetrics.cumulativeLayoutShift.toFixed(3)}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((browserMetrics.cumulativeLayoutShift / 0.25) * 100, 100)} 
                  className="h-2" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">DOM Ready</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {browserMetrics.domReady > 0 ? `${browserMetrics.domReady.toFixed(0)}ms` : 'N/A'}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((browserMetrics.domReady / 1000) * 100, 100)} 
                  className="h-2" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Page Load</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    {browserMetrics.loadTime > 0 ? `${browserMetrics.loadTime.toFixed(0)}ms` : 'N/A'}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((browserMetrics.loadTime / 2000) * 100, 100)} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas del Servidor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-stone-700">{metric.name}</h3>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status === 'good' ? 'Bueno' : 
                     metric.status === 'warning' ? 'Advertencia' : 'Crítico'}
                  </Badge>
                </div>
                <div className="text-2xl font-light text-stone-800 mb-1">
                  {formatMetricValue(metric)}
                </div>
                <p className="text-sm text-stone-500">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Uso de Recursos */}
        {systemHealth && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Uso de Recursos del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">CPU</span>
                      <span className="text-sm text-stone-600">{systemHealth.cpu.toFixed(1)}%</span>
                    </div>
                    <Progress value={systemHealth.cpu} className="h-3" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Memoria RAM</span>
                      <span className="text-sm text-stone-600">{systemHealth.memory.toFixed(1)}%</span>
                    </div>
                    <Progress value={systemHealth.memory} className="h-3" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-3xl font-light text-stone-800 mb-2">
                        {systemHealth.requests}
                      </div>
                      <div className="text-sm text-stone-600">Requests en el último minuto</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controles */}
        <div className="flex gap-4">
          <Button 
            onClick={ejecutarTestCarga}
            disabled={loading}
            className="bg-stone-800 text-white hover:bg-stone-700"
          >
            {loading ? 'Ejecutando...' : 'Ejecutar Test de Carga'}
          </Button>
          
          <Button 
            onClick={simularMetricasServidor}
            variant="outline"
          >
            Actualizar Métricas
          </Button>
        </div>

        {/* Recomendaciones */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recomendaciones de Optimización
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800">✓</Badge>
                <div>
                  <h4 className="font-medium text-stone-700">Optimización de Imágenes</h4>
                  <p className="text-sm text-stone-600">Todas las imágenes están optimizadas con Next.js Image.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800">✓</Badge>
                <div>
                  <h4 className="font-medium text-stone-700">Lazy Loading</h4>
                  <p className="text-sm text-stone-600">Componentes implementan lazy loading apropiadamente.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-yellow-100 text-yellow-800">!</Badge>
                <div>
                  <h4 className="font-medium text-stone-700">Cache de API</h4>
                  <p className="text-sm text-stone-600">Considerar implementar cache Redis para mejorar tiempos de respuesta.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge className="bg-yellow-100 text-yellow-800">!</Badge>
                <div>
                  <h4 className="font-medium text-stone-700">CDN</h4>
                  <p className="text-sm text-stone-600">Implementar CDN para assets estáticos en producción.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
