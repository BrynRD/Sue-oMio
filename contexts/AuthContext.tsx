'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'

export interface Usuario {
  id: number
  nombre: string
  email: string
  telefono?: string
  rol: 'cliente' | 'admin'
  estado: 'activo' | 'inactivo'
  fecha_registro: string
}

interface EstadoAuth {
  usuario: Usuario | null
  token: string | null
  cargando: boolean
  autenticado: boolean
}

type AccionAuth = 
  | { type: 'LOGIN_INICIO' }
  | { type: 'LOGIN_EXITO'; payload: { usuario: Usuario; token: string } }
  | { type: 'LOGIN_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'CARGAR_USUARIO'; payload: Usuario }

const estadoInicial: EstadoAuth = {
  usuario: null,
  token: null,
  cargando: true,
  autenticado: false
}

function authReducer(estado: EstadoAuth, accion: AccionAuth): EstadoAuth {
  switch (accion.type) {
    case 'LOGIN_INICIO':
      return {
        ...estado,
        cargando: true
      }
    
    case 'LOGIN_EXITO':
      return {
        ...estado,
        usuario: accion.payload.usuario,
        token: accion.payload.token,
        cargando: false,
        autenticado: true
      }
    
    case 'LOGIN_ERROR':
      return {
        ...estado,
        usuario: null,
        token: null,
        cargando: false,
        autenticado: false
      }
    
    case 'LOGOUT':
      return {
        ...estado,
        usuario: null,
        token: null,
        cargando: false,
        autenticado: false
      }
    
    case 'CARGAR_USUARIO':
      return {
        ...estado,
        usuario: accion.payload,
        cargando: false,
        autenticado: true
      }
    
    default:
      return estado
  }
}

interface AuthContextType {
  estado: EstadoAuth
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  registro: (datos: any) => Promise<boolean>
  verificarAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [estado, dispatch] = useReducer(authReducer, estadoInicial)

  // Verificar autenticación al cargar
  useEffect(() => {
    verificarAuth()
  }, [])

  // Persistir token en localStorage
  useEffect(() => {
    if (estado.token) {
      localStorage.setItem('auth_token', estado.token)
      localStorage.setItem('usuario', JSON.stringify(estado.usuario))
    } else {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('usuario')
    }
  }, [estado.token, estado.usuario])

  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_INICIO' })
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({ 
          type: 'LOGIN_EXITO', 
          payload: { usuario: data.usuario, token: data.token } 
        })
        return true
      } else {
        dispatch({ type: 'LOGIN_ERROR' })
        return false
      }
    } catch (error) {
      console.error('Error en login:', error)
      dispatch({ type: 'LOGIN_ERROR' })
      return false
    }
  }

  const logout = async () => {
    try {
      if (estado.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${estado.token}`,
          },
        })
      }
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      dispatch({ type: 'LOGOUT' })
    }
  }

  const registro = async (datos: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({ 
          type: 'LOGIN_EXITO', 
          payload: { usuario: data.usuario, token: data.token } 
        })
        return true
      } else {
        // Mostrar error específico del servidor
        const errorData = await response.json()
        console.error('Error del servidor:', errorData.error || 'Error desconocido')
        return false
      }
    } catch (error) {
      console.error('Error en registro:', error)
      return false
    }
  }

  const verificarAuth = () => {
    const token = localStorage.getItem('auth_token')
    const usuarioStr = localStorage.getItem('usuario')
    
    if (token && usuarioStr) {
      try {
        const usuario = JSON.parse(usuarioStr)
        dispatch({ 
          type: 'LOGIN_EXITO', 
          payload: { usuario, token } 
        })
      } catch (error) {
        console.error('Error al verificar auth:', error)
        dispatch({ type: 'LOGOUT' })
      }
    } else {
      dispatch({ type: 'LOGIN_ERROR' })
    }
  }

  return (
    <AuthContext.Provider value={{
      estado,
      login,
      logout,
      registro,
      verificarAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}
