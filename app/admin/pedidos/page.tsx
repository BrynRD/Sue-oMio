"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart3,
  Home,
  Package,
  ShoppingCart,
  Users,
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function OrdersPage() {
  const orders = [
    {
      id: "#3210",
      customer: "Ana García",
      email: "ana@email.com",
      date: "2024-01-15",
      total: "$250.00",
      status: "Completado",
      items: 3,
      payment: "Tarjeta",
      shipping: "Estándar",
    },
    {
      id: "#3209",
      customer: "Carlos López",
      email: "carlos@email.com",
      date: "2024-01-14",
      total: "$150.00",
      status: "Procesando",
      items: 2,
      payment: "PayPal",
      shipping: "Express",
    },
    {
      id: "#3208",
      customer: "María Rodríguez",
      email: "maria@email.com",
      date: "2024-01-14",
      total: "$89.99",
      status: "Enviado",
      items: 1,
      payment: "Tarjeta",
      shipping: "Estándar",
    },
    {
      id: "#3207",
      customer: "Juan Martínez",
      email: "juan@email.com",
      date: "2024-01-13",
      total: "$199.99",
      status: "Completado",
      items: 4,
      payment: "Transferencia",
      shipping: "Express",
    },
    {
      id: "#3206",
      customer: "Laura Sánchez",
      email: "laura@email.com",
      date: "2024-01-13",
      total: "$75.50",
      status: "Cancelado",
      items: 2,
      payment: "Tarjeta",
      shipping: "Estándar",
    },
    {
      id: "#3205",
      customer: "Pedro Gómez",
      email: "pedro@email.com",
      date: "2024-01-12",
      total: "$320.00",
      status: "Procesando",
      items: 5,
      payment: "PayPal",
      shipping: "Express",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completado":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>
      case "Procesando":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{status}</Badge>
      case "Enviado":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{status}</Badge>
      case "Cancelado":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b">
          <Link href="/" className="text-xl font-bold text-gray-900">
            SueñoMío Admin
          </Link>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <Link
              href="/admin"
              className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/productos"
              className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Package className="h-5 w-5" />
              <span>Productos</span>
            </Link>
            <Link
              href="/admin/pedidos"
              className="flex items-center space-x-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-900"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Pedidos</span>
            </Link>
            <Link
              href="/admin/usuarios"
              className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <Users className="h-5 w-5" />
              <span>Usuarios</span>
            </Link>
            <Link
              href="/admin/analytics"
              className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Analytics</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-2xl font-semibold text-gray-900">Pedidos</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline">Exportar</Button>
            </div>
          </div>
        </header>

        {/* Orders Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,350</div>
                <p className="text-xs text-green-600">+12% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pedidos Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-yellow-600">Requieren atención</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pedidos Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,280</div>
                <p className="text-xs text-green-600">97% tasa de éxito</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Valor Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$156.80</div>
                <p className="text-xs text-blue-600">+8% vs mes anterior</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Buscar por ID, cliente o email..." className="pl-10" />
                </div>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="procesando">Procesando</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="quarter">Este trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pedidos</CardTitle>
              <CardDescription>Gestiona todos los pedidos de tu tienda</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Artículos</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer}</div>
                          <div className="text-sm text-gray-500">{order.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell className="font-medium">{order.total}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{order.items} artículos</TableCell>
                      <TableCell>{order.payment}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            {order.status === "Procesando" && (
                              <DropdownMenuItem>
                                <Truck className="h-4 w-4 mr-2" />
                                Marcar como enviado
                              </DropdownMenuItem>
                            )}
                            {order.status === "Enviado" && (
                              <DropdownMenuItem>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar como completado
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar pedido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
