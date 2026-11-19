import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, Upload, Loader2, FileText } from 'lucide-react'
import { createEdital, processarEdital } from '@/services/central-simulados'

export default function EditaisPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [arquivoFile, setArquivoFile] = useState<File | null>(null)
  const [arquivoNome, setArquivoNome] = useState('')
  const [orgao, setOrgao] = useState('')
  const [analise, setAnalise] = useState<Awaited<ReturnType<typeof processarEdital>> | null>(null)
  const [processando, setProcessando] = useState(false)

  const escolherArquivo = (f: File | null) => {
    if (!f) return
    if (f.type !== 'application/pdf') {
      toast.error('Envie um PDF do edital')
      return
    }
    setArquivoFile(f)
    setArquivoNome(f.name)
    setAnalise(null)
  }

  const processar = async () => {
    if (!arquivoFile) {
      toast.error('Escolha o PDF do edital para analisar')
      return
    }
    setProcessando(true)
    setAnalise(null)
    let editalId = ''
    try {
      const edital = await createEdital(
        arquivoNome.replace(/\.pdf$/i, '') || 'Edital',
        arquivoFile,
        orgao.trim() || undefined,
      )
      editalId = edital.id
      const res = await processarEdital(edital.id)
      setAnalise(res)
      toast.success('Edital analisado!')
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Erro ao analisar o edital. Tente novamente mais tarde.',
      )
      if (editalId) {
        toast.info('O PDF ficou salvo em Editais — você pode processá-lo de novo mais tarde.')
      }
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
          <CardTitle className="text-base">1. Envie o edital em PDF</CardTitle>
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
            <Label htmlFor="edital-orgao">Órgão (opcional, para identificar o edital)</Label>
            <Input
              id="edital-orgao"
              placeholder="Ex.: TRT 4ª Região, Prefeitura de São Paulo…"
              value={orgao}
              onChange={(e) => setOrgao(e.target.value)}
            />
          </div>

          <Button onClick={processar} disabled={processando || !arquivoFile}>
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
              {orgao.trim() && <p className="text-sm font-medium">{orgao.trim()}</p>}
              {analise.cargo && <p className="text-xs text-muted-foreground">{analise.cargo}</p>}
              {analise.escolaridade && (
                <Badge variant="secondary" className="mt-1">
                  {analise.escolaridade}
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {analise.disciplinas.map((d, i) => (
                <div key={i} className="rounded-lg border p-2.5">
                  <p className="text-sm font-medium">{d.nome}</p>
                  {d.assuntos.length > 0 && (
                    <p className="text-xs text-muted-foreground">{d.assuntos.join(' · ')}</p>
                  )}
                </div>
              ))}
            </div>
            <Button
              onClick={() =>
                navigate('/simulados/criar', {
                  state: {
                    titulo: `Plano de questões — ${orgao.trim() || analise.cargo || 'edital'}`,
                    motivo: 'Baseado no edital que você enviou',
                    materias: analise.disciplinas.map((d) => d.nome),
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
