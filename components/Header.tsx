'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCarrito } from '@/contexts/CarritoContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useMoneda } from '@/contexts/MonedaContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Heart, 
  Search, 
  ShoppingBag, 
  User, 
  Menu, 
  LogOut, 
  Settings,
  Package,
  ChevronDown,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  categorias?: any[]
}

export default function Header({ categorias = [] }: HeaderProps) {
  const { estado: authEstado, logout } = useAuth()
  const { estado: carritoEstado, toggleCarrito } = useCarrito()
  const { itemCount: wishlistCount } = useWishlist()
  const { monedaActual, cambiarMoneda, getSimboloMoneda } = useMoneda()
  const router = useRouter()
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-light tracking-wide text-stone-800">
              Sueño Mío
            </span>
          </Link>

          {/* Main Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-12">
            {categorias.slice(0, 3).map((categoria: any) => (
              <Link 
                key={categoria.id}
                href={`/productos?categoria=${categoria.id}`}
                className="text-stone-600 hover:text-stone-900 transition-colors font-light tracking-wide"
              >
                {categoria.nombre}
              </Link>
            ))}
            <Link 
              href="/productos"
              className="text-stone-600 hover:text-stone-900 transition-colors font-light tracking-wide"
            >
              Todo
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Currency Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {monedaActual}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem 
                  onClick={() => cambiarMoneda('PEN')}
                  className={monedaActual === 'PEN' ? 'bg-stone-100' : ''}
                >
                  S/ PEN
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => cambiarMoneda('USD')}
                  className={monedaActual === 'USD' ? 'bg-stone-100' : ''}
                >
                  $ USD
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => cambiarMoneda('EUR')}
                  className={monedaActual === 'EUR' ? 'bg-stone-100' : ''}
                >
                  € EUR
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden sm:flex text-stone-600 hover:text-stone-900">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="ghost" size="sm" className="relative text-stone-600 hover:text-stone-900">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-stone-800 text-white text-xs">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {authEstado.autenticado ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900">
                    <User className="h-5 w-5" />
                    <span className="hidden sm:ml-2 sm:inline">
                      {authEstado.usuario?.nombre?.split(' ')[0]}
                    </span>
                    <ChevronDown className="hidden sm:ml-1 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm">{authEstado.usuario?.nombre}</p>
                      <p className="w-[200px] truncate text-xs text-stone-500">
                        {authEstado.usuario?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/perfil">
                      <Settings className="mr-2 h-4 w-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pedidos">
                      <Package className="mr-2 h-4 w-4" />
                      Mis Pedidos
                    </Link>
                  </DropdownMenuItem>
                  {authEstado.usuario?.rol === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-stone-600 hover:text-stone-900"
                onClick={() => router.push('/login')}
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:ml-2 sm:inline">Acceder</span>
              </Button>
            )}

            {/* Cart */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-stone-600 hover:text-stone-900 relative"
              onClick={toggleCarrito}
            >
              <ShoppingBag className="h-5 w-5" />
              {carritoEstado.cantidadTotal > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-stone-800 text-white"
                >
                  {carritoEstado.cantidadTotal}
                </Badge>
              )}
            </Button>

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden text-stone-600 hover:text-stone-900"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuMovilAbierto && (
          <div className="md:hidden border-t border-stone-200">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              {categorias.map((categoria: any) => (
                <Link
                  key={categoria.id}
                  href={`/productos?categoria=${categoria.id}`}
                  className="block px-3 py-2 text-base font-light text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-md"
                  onClick={() => setMenuMovilAbierto(false)}
                >
                  {categoria.nombre}
                </Link>
              ))}
              <Link
                href="/productos"
                className="block px-3 py-2 text-base font-light text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-md"
                onClick={() => setMenuMovilAbierto(false)}
              >
                Todo
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
