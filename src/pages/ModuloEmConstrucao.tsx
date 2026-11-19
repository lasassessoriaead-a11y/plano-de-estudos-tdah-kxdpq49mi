import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import { ArrowRight, Construction } from 'lucide-react'

interface Props {
  titulo: string
  descricao: string
  alternativaTexto?: string
  alternativaTo?: string
  alternativaLabel?: string
}

/**
 * Página honesta de módulo ainda não construído: informa o estado real,
 * mostra o que existirá e aponta o caminho alternativo funcional hoje.
 * Nunca simula funcionamento — nenhum botão falso.
 */
export default function ModuloEmConstrucao({
  titulo,
  descricao,
  alternativaTexto,
  alternativaTo,
  alternativaLabel,
}: Props) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">{titulo}</h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">{descricao}</p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Construction className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-2">
            <p className="font-bold text-amber-500 dark:text-amber-300">Em construção</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Este módulo ainda não está disponível na plataforma. Estamos trabalhando nele — quando
              ficar pronto, vai aparecer aqui com conteúdo real, sem placeholders.
            </p>
          </div>
        </div>
      </div>

      {alternativaTo && alternativaLabel && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            {alternativaTexto ||
              `Enquanto isso, você já pode usar o que está funcionando hoje na plataforma.`}
          </p>
          <Link to={alternativaTo} className="inline-block mt-4">
            <Button className="font-bold rounded-xl group">
              {alternativaLabel}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
