'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function AuthDebug() {
  const { estado } = useAuth()
  const [localStorage, setLocalStorage] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocalStorage({
        token: window.localStorage.getItem('auth_token'),
        usuario: window.localStorage.getItem('usuario'),
      })
    }
  }, [estado])

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      
      <div className="mb-2">
        <strong>Context Estado:</strong>
        <pre className="text-xs overflow-auto max-h-32">
          {JSON.stringify({
            autenticado: estado.autenticado,
            cargando: estado.cargando,
            usuario: estado.usuario,
            token: estado.token ? 'TOKEN_EXISTS' : null
          }, null, 2)}
        </pre>
      </div>

      <div>
        <strong>LocalStorage:</strong>
        <pre className="text-xs overflow-auto max-h-32">
          {JSON.stringify(localStorage, null, 2)}
        </pre>
      </div>
    </div>
  )
}
