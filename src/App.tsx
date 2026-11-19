import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/Layout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Onboarding from './pages/Onboarding'
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
import SimuladosHub from './pages/SimuladosHub'
import CriarProvaPage from './pages/CriarProvaPage'
import ProvaIaPage from './pages/ProvaIaPage'
import ResultadoIaPage from './pages/ResultadoIaPage'
import HistoricoSimulados from './pages/HistoricoSimulados'
import BancoQuestoes from './pages/BancoQuestoes'
import CatalogoInstituicoes from './pages/CatalogoInstituicoes'
import PaginaInstituicao from './pages/PaginaInstituicao'
import EditaisPage from './pages/EditaisPage'
import ModuloEmConstrucao from './pages/ModuloEmConstrucao'
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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/onboarding" element={<ProtectedRoute />}>
            <Route index element={<Onboarding />} />
          </Route>

          {/* Rotas Protegidas no Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/inicio" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/missao" element={<MissaoHoje />} />
              <Route path="/plano" element={<PlanoEstudos />} />
              <Route path="/erros" element={<BancoErros />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/mapas" element={<MapasMentais />} />
              <Route path="/mapas-mentais" element={<Navigate to="/mapas" replace />} />
              <Route
                path="/central-provas"
                element={
                  <ModuloEmConstrucao
                    titulo="Central de Provas"
                    descricao="Edições passadas de provas oficiais organizadas por ano e banca, para prática direcionada."
                    alternativaTo="/simulados"
                    alternativaLabel="Ir para Simulados"
                  />
                }
              />
              <Route
                path="/banco-questoes"
                element={
                  <ModuloEmConstrucao
                    titulo="Banco de Questões"
                    descricao="Banco completo de questões por matéria e assunto, com filtros e modo de prática."
                    alternativaTo="/simulados"
                    alternativaLabel="Praticar com Simulados"
                  />
                }
              />
              <Route
                path="/redacao"
                element={
                  <ModuloEmConstrucao
                    titulo="Redação"
                    descricao="Treino dedicado de redação como aba própria. A correção de redação dentro dos Simulados continua funcionando normalmente."
                    alternativaTo="/simulados"
                    alternativaLabel="Corrigir redação nos Simulados"
                  />
                }
              />
              <Route
                path="/historico"
                element={
                  <ModuloEmConstrucao
                    titulo="Histórico e Desempenho"
                    descricao="Consolidado do seu desempenho ao longo do tempo: provas respondidas, evolução por matéria e tendências."
                    alternativaTo="/dashboard"
                    alternativaLabel="Ver estatísticas no Dashboard"
                  />
                }
              />
              <Route
                path="/whatsapp"
                element={
                  <ModuloEmConstrucao
                    titulo="WhatsApp"
                    descricao="Integração com WhatsApp para lembretes de estudo e avisos do plano, direto no seu celular."
                    alternativaTo="/configuracoes"
                    alternativaLabel="Configurar alertas"
                  />
                }
              />
              <Route path="/notificacoes" element={<Notificacoes />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              {/* Central de Simulados — hub novo */}
              <Route path="/simulados" element={<SimuladosHub />} />
              {/* Fluxo ENEM (intacto) sob /simulados/enem, com redirects das rotas antigas */}
              <Route path="/simulados/enem" element={<Simulados />} />
              <Route path="/simulados/enem/prova/:simuladoId" element={<SimuladoProva />} />
              <Route
                path="/simulados/enem/resultado/:tentativaId"
                element={<SimuladoResultado />}
              />
              <Route
                path="/simulados/prova/:simuladoId"
                element={<Navigate to="/simulados/enem" replace />}
              />
              <Route
                path="/simulados/resultado/:tentativaId"
                element={<Navigate to="/simulados/enem" replace />}
              />
              {/* Provas por IA / histórico / banco / catálogos / editais */}
              <Route path="/simulados/criar" element={<CriarProvaPage />} />
              <Route path="/simulados/prova-ia/:id" element={<ProvaIaPage />} />
              <Route path="/simulados/resultado-ia/:id" element={<ResultadoIaPage />} />
              <Route path="/simulados/historico" element={<HistoricoSimulados />} />
              <Route path="/simulados/banco" element={<BancoQuestoes />} />
              <Route path="/simulados/vestibulares" element={<CatalogoInstituicoes />} />
              <Route path="/simulados/concursos" element={<CatalogoInstituicoes />} />
              <Route path="/simulados/instituicao/:id" element={<PaginaInstituicao />} />
              <Route path="/simulados/editais" element={<EditaisPage />} />
              <Route path="/simulados/provas-anteriores" element={<CatalogoInstituicoes />} />
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
