import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Gift, Pencil } from 'lucide-react'
import { createRecompensa, updateRecompensa, RecompensaRecord } from '@/services/recompensas'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import { z } from 'zod'

const rewardSchema = z
  .object({
    titulo: z.string().min(1, 'O título é obrigatório'),
    tipo: z.enum(['dinheiro', 'outro']),
    valor: z.number().positive('O valor deve ser positivo').optional(),
  })
  .refine((data) => data.tipo !== 'dinheiro' || (data.valor !== undefined && data.valor > 0), {
    message: 'Informe um valor positivo',
    path: ['valor'],
  })

interface RewardConfigDialogProps {
  missaoId: string
  missaoTitulo: string
  existingReward?: RecompensaRecord
  onSaved?: () => void
  trigger?: 'add' | 'edit'
}

export function RewardConfigDialog({
  missaoId,
  missaoTitulo,
  existingReward,
  onSaved,
  trigger = 'add',
}: RewardConfigDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState(existingReward?.titulo || '')
  const [tipo, setTipo] = useState<'dinheiro' | 'outro'>(existingReward?.tipo || 'dinheiro')
  const [valor, setValor] = useState(
    existingReward?.valor !== undefined ? String(existingReward.valor) : '',
  )
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setErrors({})
    const valorNum = tipo === 'dinheiro' && valor.trim() !== '' ? parseFloat(valor) : undefined

    const parsed = rewardSchema.safeParse({ titulo, tipo, valor: valorNum })
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as string
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      const data = {
        usuario_id: user!.id,
        missao_id: missaoId,
        titulo: parsed.data.titulo,
        tipo: parsed.data.tipo,
        valor: parsed.data.tipo === 'dinheiro' ? parsed.data.valor : 0,
        status: existingReward?.status || ('disponivel' as const),
      }

      if (existingReward) {
        await updateRecompensa(existingReward.id, data)
        toast({ title: 'Recompensa atualizada! 🎁' })
      } else {
        await createRecompensa(data)
        toast({ title: 'Recompensa configurada! 🎁' })
      }
      setOpen(false)
      onSaved?.()
    } catch (err) {
      setErrors(extractFieldErrors(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-xs font-bold rounded-lg h-7 px-2.5 shrink-0"
        >
          {trigger === 'edit' ? (
            <>
              <Pencil className="w-3 h-3 mr-1" /> Recompensa
            </>
          ) : (
            <>
              <Gift className="w-3 h-3 mr-1" /> Recompensa
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-600" />
            Configurar Recompensa
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-500 font-medium">
            Missão: <span className="font-bold text-slate-700">{missaoTitulo}</span>
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Título da Recompensa</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Comprar um açaí, R$ 10..."
              className="text-sm rounded-xl"
            />
            {errors.titulo && <p className="text-xs text-red-500">{errors.titulo}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as 'dinheiro' | 'outro')}>
              <SelectTrigger className="text-sm rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">💰 Dinheiro</SelectItem>
                <SelectItem value="outro">🎁 Recompensa especial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tipo === 'dinheiro' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 10.00"
                className="text-sm rounded-xl"
              />
              {errors.valor && <p className="text-xs text-red-500">{errors.valor}</p>}
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl"
          >
            {saving ? 'Salvando...' : existingReward ? 'Atualizar' : 'Salvar Recompensa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
