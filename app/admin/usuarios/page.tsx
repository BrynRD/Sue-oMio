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
  Edit,
  Ban,
  UserCheck,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function UsersPage() {
  const users = [
    {
      id: 1,
      name: "Ana García",
      email: "ana@email.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Cliente",
      status: "Activo",
      orders: 12,
      totalSpent: "$1,250.00",
      joinDate: "2023-06-15",
      lastLogin: "2024-01-15",
    },
    {
      id: 2,
      name: "Carlos López",
      email: "carlos@email.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Cliente VIP",
      status: "Activo",
      orders: 28,
      totalSpent: "$3,450.00",
      joinDate: "2023-03-22",
      lastLogin: "2024-01-14",
    },
    {
      id: 3,
      name: "María Rodríguez",
      email: "maria@email.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Cliente",
      status: "Activo",
      orders: 8,
      totalSpent: "$680.50",
      joinDate: "2023-09-10",
      lastLogin: "2024-01-13",
    },
    {
      id: 4,
      name: "Juan Martínez",
      email: "juan@email.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Cliente",
      status: "Inactivo",
      orders: 3,
      totalSpent: "$150.00",
      joinDate: "2023-11-05",
      lastLogin: "2023-12-20",
    },
    {
      id: 5,
      name: "Laura Sánchez",
      email: "laura@email.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Cliente",
      status: "Suspendido",
      orders: 5,
      totalSpent: "$320.00",
      joinDate: "2023-08-18",
      lastLogin: "2024-01-10",
    },
    {
      id: 6,
      name: "Pedro Gómez",
      email: "pedro@email.com",
      avatar: "/placeholder.svg?height=40&width=40",
      role: "Cliente VIP",
      status: "Activo",
      orders: 45,
      totalSpent: "$5,680.00",
      joinDate: "2022-12-03",
      lastLogin: "2024-01-15",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Activo":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{status}</Badge>
      case "Inactivo":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>
      case "Suspendido":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Cliente VIP":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">{role}</Badge>
      case "Cliente":
        return <Badge variant="outline">{role}</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
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
              className="flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Pedidos</span>
            </Link>
            <Link
              href="/admin/usuarios"
              className="flex items-center space-x-3 rounded-lg bg-gray-100 px-3 py-2 text-gray-900"
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
            <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
            <div className="flex items-center space-x-4">
              <Button variant="outline">Exportar</Button>
              <Button>Invitar Usuario</Button>
            </div>
          </div>
        </header>

        {/* Users Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">573</div>
                <p className="text-xs text-green-600">+201 este mes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Usuarios Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">489</div>
                <p className="text-xs text-green-600">85% del total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Clientes VIP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-purple-600">8% del total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Nuevos Este Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-blue-600">+23% vs mes anterior</p>
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
                  <Input placeholder="Buscar por nombre o email..." className="pl-10" />
                </div>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="cliente-vip">Cliente VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuarios</CardTitle>
              <CardDescription>Gestiona todos los usuarios registrados en tu tienda</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Total Gastado</TableHead>
                    <TableHead>Último Acceso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{user.orders} pedidos</TableCell>
                      <TableCell className="font-medium">{user.totalSpent}</TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
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
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar usuario
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Enviar email
                            </DropdownMenuItem>
                            {user.status === "Activo" && (
                              <DropdownMenuItem>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Promover a VIP
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="h-4 w-4 mr-2" />
                              Suspender usuario
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
