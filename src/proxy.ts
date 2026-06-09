import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/', '/login', '/register', '/api/auth/callback']

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Verificar sessão do Supabase armazenada em cookie
  const token = request.cookies.get('sb-access-token')?.value

  // Se não tem token e está tentando acessar rota protegida, redirecionar para /login
  if (!token && (pathname.startsWith('/admin') || pathname.startsWith('/aluno') || pathname.startsWith('/professor'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
