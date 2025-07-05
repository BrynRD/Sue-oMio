import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Obtener el token del header Authorization
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      return NextResponse.json({ 
        error: 'No token provided',
        isAuthenticated: false 
      }, { status: 401 })
    }

    // Verificar el token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      return NextResponse.json({
        isAuthenticated: true,
        decoded: decoded,
        message: 'Token válido'
      })
    } catch (jwtError) {
      return NextResponse.json({
        error: 'Token inválido',
        isAuthenticated: false,
        jwtError: jwtError instanceof Error ? jwtError.message : 'Unknown JWT error'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Error en debug auth:', error)
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
