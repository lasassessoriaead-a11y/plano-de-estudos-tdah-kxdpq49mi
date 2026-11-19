import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import {
  Brain,
  CalendarDays,
  ClipboardList,
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
  Bot,
  CheckCircle2,
  Map,
  FileText,
} from 'lucide-react'

const beneficios = [
  {
    icon: Brain,
    titulo: 'Mentor IA 24/7',
    texto:
      'Tire dúvidas, peça resumos e receba explicações no seu ritmo — de forma resumida ou detalhada.',
  },
  {
    icon: CalendarDays,
    titulo: 'Planejamento inteligente',
    texto: 'Sprints de 15 minutos encaixados na sua rotina, com metas diárias e semanais reais.',
  },
  {
    icon: FileText,
    titulo: 'Banco de questões',
    texto: 'Pratique com questões organizadas por matéria, tópico e nível de dificuldade.',
  },
  {
    icon: ClipboardList,
    titulo: 'Simulados completos',
    texto: 'Provas no formato ENEM com correção automática e avaliação de redação por IA.',
  },
  {
    icon: Map,
    titulo: 'Mapas mentais',
    texto: 'Revisão visual gerada por IA, editável, para fixar o conteúdo que mais cai.',
  },
  {
    icon: TrendingUp,
    titulo: 'Desempenho de verdade',
    texto:
      'Acompanhe acertos, tempo de estudo e evolução com dados reais — nada de números falsos.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Fundo decorativo */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Cabeçalho */}
        <header className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro" className="hidden sm:block">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">
                  Criar conta
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-bold mb-8 animate-slide-up">
            <Sparkles className="w-3.5 h-3.5" />
            IA + planejamento + questões + simulados
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] animate-slide-up stagger-1">
            Seu próximo nível começa com{' '}
            <span className="bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 bg-clip-text text-transparent">
              uma decisão.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto font-medium animate-slide-up stagger-2">
            A NEXORA une inteligência artificial, planejamento, banco de questões e simulados para
            preparar você para o ENEM, vestibulares, faculdades particulares e concursos — no seu
            ritmo, com foco real.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
            <Link to="/cadastro" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-base rounded-xl px-8 py-6 shadow-[0_0_30px_-8px_rgba(37,99,235,0.8)] transition-all duration-200 group"
              >
                Começar minha jornada
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/20 bg-white/5 hover:bg-white/10 hover:text-white text-white font-bold text-base rounded-xl px-8 py-6"
              >
                Já tenho uma conta
              </Button>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto animate-slide-up stagger-4">
            {['ENEM', 'Vestibulares', 'Faculdades', 'Concursos'].map((alvo) => (
              <div
                key={alvo}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors"
              >
                {alvo}
              </div>
            ))}
          </div>
        </section>

        {/* Benefícios */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/5">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center">
            Tudo o que você precisa em um só lugar
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 text-center max-w-xl mx-auto">
            Ferramentas pensadas para quem estuda com pouco tempo e precisa de foco — não de
            conteúdo infinito.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {beneficios.map((b, i) => {
              const Icon = b.icon
              return (
                <div
                  key={b.titulo}
                  className={`group rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-blue-500/40 hover:bg-white/[0.06] transition-all duration-200 animate-slide-up stagger-${(i % 4) + 1}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center mb-4 group-hover:bg-blue-600/25 transition-colors">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white">{b.titulo}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{b.texto}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Mentor IA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-bold mb-5">
                <Bot className="w-3.5 h-3.5" />
                Apresentando o Mentor IA
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Um mentor que entende como você estuda
              </h2>
              <p className="mt-4 text-slate-400 leading-relaxed">
                O Mentor IA conhece seu objetivo, suas matérias difíceis e o seu nível. Ele explica
                do jeito que você aprende melhor: se prefere explicações resumidas ou detalhadas,
                questões, leitura, mapas mentais ou revisões — o plano se adapta a você, não o
                contrário.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Explica qualquer tópico no seu estilo preferido',
                  'Monta e corrige o esqueleto da sua redação',
                  'Sugere o próximo passo com base no seu desempenho',
                  'Reforça conteúdos que você errou, na hora certa',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4.5 h-4.5 text-blue-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/cadastro" className="inline-block mt-8">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">
                  <Target className="w-4 h-4 mr-2" />
                  Quero conhecer meu Mentor
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative rounded-2xl border border-white/10 bg-[#0a0a0c] p-5 sm:p-6 space-y-3 shadow-elevation">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Mentor IA</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online agora
                    </p>
                  </div>
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-white/10 bg-white/5 p-3.5 text-sm text-slate-300">
                  Estou com dificuldade em funções e tenho 2 horas livres hoje. O que faço?
                </div>
                <div className="max-w-[85%] ml-auto rounded-2xl rounded-tr-none bg-blue-600 p-3.5 text-sm text-white">
                  Fechado. Vamos dividir em dois sprints de 45 minutos: comece com 20 questões de
                  função afim para mapear seus erros — depois eu monto um mapa mental só do que você
                  errar. Pronto para começar?
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  Exemplo ilustrativo — o Mentor adapta a resposta ao seu histórico real.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="border-t border-white/10 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-xs text-slate-500 font-medium">
              Inteligência que transforma estudo em aprovação.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
