import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

interface ProtectedRouteProps {
  requiredRole?: 'responsavel' | 'aluno'
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-violet-700 animate-pulse">
            Carregando Missão Medicina...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRole = user?.role || 'aluno'

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'responsavel' ? '/responsavel' : '/'} replace />
  }

  return <Outlet />
}
