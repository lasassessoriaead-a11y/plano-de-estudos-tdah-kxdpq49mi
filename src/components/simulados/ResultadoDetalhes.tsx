import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { QuestaoProva } from '@/services/central-simulados'

interface Props {
  questao: QuestaoProva
  numero: number
  idx?: number
}

export default function ResultadoDetalhes({ questao, numero }: Props) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="destructive">Questão {numero}</Badge>
        <Badge variant="secondary">
          {questao.materia}
          {questao.assunto ? ` — ${questao.assunto}` : ''}
        </Badge>
        {questao.origem === 'gerada_ia' && <Badge variant="outline">Gerada por IA</Badge>}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{questao.enunciado}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p>
          <span className="font-medium text-green-600">Gabarito:</span>{' '}
          {questao.tipo_questao === 'certo_errado'
            ? Number(questao.gabarito) === 0
              ? 'Certo'
              : 'Errado'
            : String.fromCharCode(65 + Number(questao.gabarito))}
        </p>
        {(questao.alternativas ?? []).length > 0 && (
          <ul className="list-inside list-disc text-muted-foreground">
            {(questao.alternativas ?? []).map((alt, i) => (
              <li key={i}>
                {String.fromCharCode(65 + i)}) {alt}
              </li>
            ))}
          </ul>
        )}
        {questao.resolucao_comentada && (
          <p className="mt-2 rounded-md bg-muted p-2 text-sm">
            <span className="font-medium">Resolução comentada:</span> {questao.resolucao_comentada}
          </p>
        )}
      </div>
    </div>
  )
}
