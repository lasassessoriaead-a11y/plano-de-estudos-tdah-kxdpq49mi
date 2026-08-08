import pb from '@/lib/pocketbase/client'
import { MateriaRecord } from './materias'

export interface TopicoRecord {
  id: string
  titulo: string
  materia_id: string
  prioridade?: number
  tipo?: 'fluxograma' | 'pratica' | 'esqueleto'
  descricao?: string
  expand?: {
    materia_id?: MateriaRecord
  }
}

export const getTopicos = async (materiaId?: string): Promise<TopicoRecord[]> => {
  const filter = materiaId ? `materia_id="${materiaId}"` : ''
  return pb.collection('topicos').getFullList<TopicoRecord>({
    filter,
    sort: 'prioridade',
    expand: 'materia_id',
  })
}
