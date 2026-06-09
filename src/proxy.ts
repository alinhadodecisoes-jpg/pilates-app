import { type NextRequest, NextResponse } from 'next/server'

// IMPORTANTE: A sessão do Supabase é salva em localStorage (client-side),
// NÃO em cookies. Por isso o proxy server-side NÃO pode verificar autenticação.
// A proteção de rotas é feita pelo hook usePilatesAuth no client-side.
export async function proxy(request: NextRequest) {
  // Passthrough total — sem redirecionamentos server-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
