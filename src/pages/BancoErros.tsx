import { useState, useEffect } from 'react'
import { getQuestoes, updateQuestao, QuestaoRecord } from '@/services/questoes'
import { SubjectBadge } from '@/components/SubjectBadge'
import { Button } from '@/components/ui/button'
import { AlertCircle, RotateCcw, CheckCircle2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function BancoErros() {
  const { toast } = useToast()
  const [questoes, setQuestoes] = useState<QuestaoRecord[]>([])
  const [filterStatus, setFilterStatus] = useState<'errou' | 'todos'>('errou')

  const loadData = async () => {
    const list = await getQuestoes()
    setQuestoes(list)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleMarcarRevisado = async (q: QuestaoRecord) => {
    try {
      await updateQuestao(q.id, {
        status: 'acertou',
      })
      toast({
        title: 'Revisão Registrada! 🎉',
        description: 'Questão atualizada com sucesso no seu histórico.',
      })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const listFiltered = questoes.filter((q) => {
    if (filterStatus === 'errou') return q.status === 'errou'
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Banco de Erros</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Revisão espaçada (1d, 3d, 7d, 15d) para fixação permanente
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('errou')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              filterStatus === 'errou'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            Pendentes de Revisão
          </button>
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              filterStatus === 'todos'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border'
            }`}
          >
            Todas as Questões
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {listFiltered.length === 0 ? (
          <div className="bg-card p-8 rounded-2xl border border-border text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Tudo limpo por aqui!</h3>
            <p className="text-xs text-muted-foreground">
              Você não tem questões pendentes para revisão no momento.
            </p>
          </div>
        ) : (
          listFiltered.map((q) => {
            const mat = q.expand?.materia_id
            return (
              <div
                key={q.id}
                className="bg-card p-5 rounded-2xl border border-border shadow-subtle space-y-3"
              >
                <div className="flex items-center justify-between">
                  {mat && <SubjectBadge nome={mat.nome} cor={mat.cor} icone={mat.icone} />}
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      q.status === 'errou'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {q.status === 'errou' ? 'Revisão Pendente' : 'Acertou'}
                  </span>
                </div>

                <p className="text-sm font-bold text-foreground">{q.enunciado}</p>

                {q.explicacao && (
                  <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 text-xs text-foreground">
                    <p className="font-bold text-primary mb-1">💡 Explicação Didática:</p>
                    <p>{q.explicacao}</p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Próxima revisão em breve
                  </span>

                  {q.status === 'errou' && (
                    <Button
                      size="sm"
                      onClick={() => handleMarcarRevisado(q)}
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl h-8 px-3"
                    >
                      Marcar como Revisado
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
