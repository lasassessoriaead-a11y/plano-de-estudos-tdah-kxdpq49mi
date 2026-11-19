import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/Layout'

import Index from './pages/Index'
import MapasMentais from './pages/MapasMentais'
import MissaoHoje from './pages/MissaoHoje'
import PlanoEstudos from './pages/PlanoEstudos'
import BancoErros from './pages/BancoErros'
import Chat from './pages/Chat'
import Dashboard from './pages/Dashboard'
import Configuracoes from './pages/Configuracoes'
import Notificacoes from './pages/Notificacoes'
import Simulados from './pages/Simulados'
import SimuladoProva from './pages/SimuladoProva'
import SimuladoResultado from './pages/SimuladoResultado'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import NotFound from './pages/NotFound'
import ResponsavelLayout from './components/ResponsavelLayout'
import ResponsavelHome from './pages/ResponsavelHome'
import ResponsavelRecompensas from './pages/ResponsavelRecompensas'

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
              <Route path="/erros" element={<BancoErros />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/mapas" element={<MapasMentais />} />
              <Route path="/notificacoes" element={<Notificacoes />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/simulados" element={<Simulados />} />
              <Route path="/simulados/prova/:simuladoId" element={<SimuladoProva />} />
              <Route path="/simulados/resultado/:tentativaId" element={<SimuladoResultado />} />
            </Route>
          </Route>

          {/* Rotas do Responsável (recompensa invisível ao aluno) */}
          <Route element={<ProtectedRoute requiredRole="responsavel" />}>
            <Route path="/responsavel" element={<ResponsavelLayout />}>
              <Route index element={<ResponsavelHome />} />
              <Route path="recompensas" element={<ResponsavelRecompensas />} />
              <Route path="notificacoes" element={<Notificacoes />} />
              <Route path="config" element={<Configuracoes />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
