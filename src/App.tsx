import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/Layout'

import Index from './pages/Index'
import MissaoHoje from './pages/MissaoHoje'
import PlanoEstudos from './pages/PlanoEstudos'
import BancoErros from './pages/BancoErros'
import Chat from './pages/Chat'
import Recompensas from './pages/Recompensas'
import Dashboard from './pages/Dashboard'
import MPC from './pages/MPC'
import Configuracoes from './pages/Configuracoes'
import Notificacoes from './pages/Notificacoes'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          {/* Rotas Protegidas no Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/missao" element={<MissaoHoje />} />
              <Route path="/plano" element={<PlanoEstudos />} />
              <Route path="/mpc" element={<MPC />} />
              <Route path="/erros" element={<BancoErros />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/recompensas" element={<Recompensas />} />
              <Route path="/notificacoes" element={<Notificacoes />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
