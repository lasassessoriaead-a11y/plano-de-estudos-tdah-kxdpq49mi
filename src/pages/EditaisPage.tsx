import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Upload, Loader2, FileText } from 'lucide-react'
import { analisarEdital, type EditalAnalise } from '@/services/central-simulados'

export default function EditaisPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [texto, setTexto] = useState('')
  const [analise, setAnalise] = useState<EditalAnalise | null>(null)
  const [processando, setProcessando] = useState(false)
  const [arquivoNome, setArquivoNome] = useState('')
  const [arquivoFile, setArquivoFile] = useState<File | null>(null)

  const escolherArquivo = (f: File | null) => {
    if (!f) return
    if (f.type !== 'application/pdf') {
      toast.error('Envie um PDF do edital')
      return
    }
    setArquivoFile(f)
    setArquivoNome(f.name)
  }

  const processar = async () => {
    if (!arquivoFile && !texto.trim()) {
      toast.error('Envie o PDF do edital ou cole o texto das disciplinas')
      return
    }
    setProcessando(true)
    setAnalise(null)
    try {
      // PDF: enviaremos apenas o nome + pedido de extração pelo hook
      // (documento em si é lido server-side quando disponível; texto colado tem prioridade)
      const res = await analisarEdital({
        nome_arquivo: arquivoNome || undefined,
        texto: texto.trim() || undefined,
        tem_pdf: !!arquivoFile,
      })
      setAnalise(res)
      toast.success('Edital analisado!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao analisar o edital')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileText className="h-6 w-6" /> Editais de concurso
        </h1>
        <p className="text-sm text-muted-foreground">
          Envie o PDF do edital e a IA extrai as disciplinas para montar seu plano de questões. Os
          conteúdos vêm do próprio edital — nada é inventado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Envie o edital (PDF) ou cole o texto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => escolherArquivo(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50"
          >
            <Upload className="h-6 w-6" />
            {arquivoNome ? arquivoNome : 'Clique para escolher o PDF do edital'}
          </button>

          <div className="grid gap-1.5">
            <Label htmlFor="edital-texto">Ou cole o trecho do edital (conteúdo programático)</Label>
            <Textarea
              id="edital-texto"
              rows={6}
              placeholder="Ex.: CONHECIMENTOS BÁSICOS: Língua Portuguesa… CONHECIMENTOS ESPECÍFICOS:…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
          </div>

          <Button onClick={processar} disabled={processando}>
            {processando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {processando ? 'Analisando edital…' : 'Analisar com IA'}
          </Button>
        </CardContent>
      </Card>

      {analise && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disciplinas extraídas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">{analise.orgao || 'Órgão não identificado'}</p>
              <p className="text-xs text-muted-foreground">
                {analise.cargo || 'Cargo não identificado'}
              </p>
              {analise.escolaridade && (
                <Badge variant="secondary" className="mt-1">
                  {analise.escolaridade}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(analise.disciplinas ?? []).map((d, i) => (
                <Badge key={i} variant="outline">
                  {d.nome}
                  {d.peso ? ` (peso ${d.peso})` : ''}
                </Badge>
              ))}
            </div>
            {(analise.observacoes ?? []).length > 0 && (
              <ul className="list-inside list-disc text-xs text-muted-foreground">
                {analise.observacoes.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            )}
            <Button
              onClick={() =>
                navigate('/simulados/criar', {
                  state: {
                    titulo: `Plano de questões — ${analise.orgao || 'edital'}`,
                    motivo: 'Baseado no edital que você enviou',
                    materias: (analise.disciplinas ?? []).map((d) => d.nome),
                    modo: 'base_provas_reais' as const,
                  },
                })
              }
            >
              <Sparkles className="mr-2 h-4 w-4" /> Montar plano de questões
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/simulados/concursos')}>
          Voltar para concursos
        </Button>
      </div>
    </div>
  )
}
