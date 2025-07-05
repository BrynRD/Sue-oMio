import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ mensaje: 'Logout exitoso' });
    
    // Eliminar la cookie de autenticación
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    });
    
    return response;
  } catch (error) {
    console.error('Error en POST /api/auth/logout:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
