import { useState, useRef, useEffect } from 'react'
import { streamAgentChat, AgentCitation } from '@/lib/skipAi'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AgentCitation[]
}

const quickPrompts = [
  'Explique membrana plasmática de forma simples',
  'Como montar um esqueleto de redação nota 900+?',
  'Qual a melhor estratégia para o ENEM na semana da prova?',
  'Avalie minha tese: O estigma do TDAH prejudica a inclusão escolar.',
]

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Eu sou a **Coruja Mentora** 🦉. Como posso ajudar seu estudo hoje? Pode me mandar dúvidas de conteúdo ou um parágrafo de redação para eu avaliar!',
    },
  ])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input
    if (!text.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setLoading(true)

    const assistantMsgId = (Date.now() + 1).toString()
    setMessages((prev) => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }])

    try {
      const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/ask-coruja`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
        }),
      })

      let currentCitations: AgentCitation[] | undefined

      const result = await streamAgentChat(res, {
        onChunk: (_delta, accumulated) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: accumulated } : m)),
          )
        },
        onCitations: (items) => {
          currentCitations = items
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, citations: items } : m)),
          )
        },
      })

      if (result.conversation_id) {
        setConversationId(result.conversation_id)
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  'Ops, ocorreu um erro ao se comunicar com a Coruja Mentora. Tente novamente em instantes!',
              }
            : m,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
      {/* Header Chat */}
      <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl">
          🦉
        </div>
        <div>
          <h2 className="text-sm font-extrabold">Coruja Mentora AI</h2>
          <p className="text-[11px] text-violet-100 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online • Mentor de estudos NEXORA
          </p>
        </div>
      </div>

      {/* Quick Prompts Chips */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto flex gap-2">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-3 py-1 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-300 text-slate-700 text-xs font-semibold rounded-full shrink-0 transition-colors shadow-2xs"
          >
            ✨ {p}
          </button>
        ))}
      </div>

      {/* Body Mensagens */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user'
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  isUser
                    ? 'bg-violet-600 text-white'
                    : 'bg-gradient-to-tr from-amber-500 to-violet-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : '🦉'}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm space-y-2 ${
                  isUser
                    ? 'bg-violet-600 text-white rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                {m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
                    <p className="font-bold">Fontes consultadas:</p>
                    {m.citations.map((c, i) => (
                      <p key={i} className="italic">
                        • {c.excerpt}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        className="p-3 bg-white border-t border-slate-200 flex gap-2"
      >
        <Input
          type="text"
          placeholder="Digite sua dúvida ou cole seu parágrafo de redação..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="text-xs sm:text-sm rounded-xl border-slate-200 focus:border-violet-500"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl px-4 shrink-0"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  )
}
