import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getInstituicao,
  listProvasAnteriores,
  listProvasIa,
  listTentativasIa,
  type ProvaAnteriorRecord,
  type ProvaIaRecord,
} from '@/services/central-simulados'
import { BookOpen, FileText, Target, TrendingUp } from 'lucide-react'

export default function PaginaInstituicao() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inst, setInst] = useState<Awaited<ReturnType<typeof getInstituicao>> | null>(null)
  const [provasAnteriores, setProvasAnteriores] = useState<ProvaAnteriorRecord[]>([])
  const [meusSimulados, setMeusSimulados] = useState<ProvaIaRecord[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!id) return
    let alive = true
    Promise.all([
      getInstituicao(id),
      listProvasAnteriores().catch(() => [] as ProvaAnteriorRecord[]),
      listProvasIa().catch(() => [] as ProvaIaRecord[]),
    ])
      .then(([i, pa, pi]) => {
        if (!alive) return
        setInst(i)
        const siglaNome = i.sigla || i.nome
        setProvasAnteriores(
          pa.filter((p) => p.instituicao.includes(siglaNome) || p.instituicao.includes(i.nome)),
        )
        setMeusSimulados(
          pi.filter(
            (p) =>
              (p.instituicao ?? '').includes(siglaNome) || (p.instituicao ?? '').includes(i.nome),
          ),
        )
      })
      .catch(() => alive && setInst(null))
      .finally(() => alive && setCarregando(false))
    return () => {
      alive = false
    }
  }, [id])

  const desempenho = useMemo(() => {
    if (!inst) return null
    const siglaNome = inst.sigla || inst.nome
    const ids = meusSimulados.map((p) => p.id)
    return ids.length ? ids : null
  }, [inst, meusSimulados])

  if (carregando) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!inst) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p>Instituição não encontrada.</p>
        <Button variant="outline" onClick={() => navigate('/simulados')} className="mt-4">
          Voltar
        </Button>
      </div>
    )
  }

  const formato =
    typeof inst.formato_json === 'string'
      ? (() => {
          try {
            return JSON.parse(inst.formato_json) as Record<string, string>
          } catch {
            return {}
          }
        })()
      : (inst.formato_json ?? {})

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {inst.categoria === 'concurso'
            ? 'Concurso'
            : inst.tipo === 'particular'
              ? 'Faculdade particular'
              : 'Universidade'}
        </p>
        <h1 className="text-2xl font-bold">
          {inst.sigla ? `${inst.sigla} — ${inst.nome}` : inst.nome}
        </h1>
        {inst.bancas && (
          <p className="mt-1 text-sm text-muted-foreground">Banca(s): {inst.bancas}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" /> Apresentação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {inst.descricao || 'Ainda sem descrição para esta instituição.'}
          </p>
          {Object.keys(formato).length > 0 && (
            <div className="mt-3 grid gap-1.5 text-sm">
              {Object.entries(formato).map(([k, v]) => (
                <p key={k}>
                  <span className="font-medium">{k}:</span>{' '}
                  <span className="text-muted-foreground">
                    {String(v)} {!v && '(a confirmar)'}
                  </span>
                </p>
              ))}
            </div>
          )}
          {inst.cursos && (
            <p className="mt-3 text-sm">
              <span className="font-medium">Cursos:</span>{' '}
              <span className="text-muted-foreground">{inst.cursos}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" /> Provas anteriores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {provasAnteriores.length ? (
            <ul className="space-y-2">
              {provasAnteriores.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.ano}
                      {p.fase ? ` — ${p.fase}` : ''}
                      {p.total_questoes ? ` — ${p.total_questoes} questões` : ''}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/simulados/provas-anteriores')}
                  >
                    Fazer
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ainda não há provas anteriores desta instituição no banco (a confirmar — importação em
              andamento).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" /> Meus simulados desta instituição
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meusSimulados.length ? (
            <ul className="space-y-2">
              {meusSimulados.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <p className="text-sm font-medium">{p.titulo}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/simulados/prova-ia/${p.id}`)}
                  >
                    Abrir
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum simulado seu desta instituição ainda.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4" /> Histórico de desempenho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {meusSimulados.length
              ? 'Seu desempenho por tentativa aparece na página de resultado de cada simulado e no comparativo do histórico.'
              : 'Faça um simulado desta instituição para começar a acompanhar seu desempenho.'}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/simulados')}>
          Voltar para a Central
        </Button>
      </div>
    </div>
  )
}
