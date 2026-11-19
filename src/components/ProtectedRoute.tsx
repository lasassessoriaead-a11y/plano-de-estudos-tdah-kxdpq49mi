import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { NexoraSplash } from '@/components/Logo'

interface ProtectedRouteProps {
  requiredRole?: 'responsavel' | 'aluno'
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <NexoraSplash message="Carregando sua jornada..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const userRole = user?.role || 'aluno'

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'responsavel' ? '/responsavel' : '/inicio'} replace />
  }

  return <Outlet />
}
