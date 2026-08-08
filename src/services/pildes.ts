import pb from '@/lib/pocketbase/client'
import { TopicoRecord } from './topicos'

export interface PildeRecord {
  id: string
  topico_id: string
  titulo: string
  conteudo_teorico?: string
  formato?: 'esquema' | 'mapa_mental' | 'fluxograma' | 'topicos_diretos' | 'esqueleto_redacao'
  duracao_teorica?: number
  expand?: {
    topico_id?: TopicoRecord
  }
}

export const getPildes = async (): Promise<PildeRecord[]> => {
  return pb.collection('pildes').getFullList<PildeRecord>({
    expand: 'topico_id,topico_id.materia_id',
  })
}

export const getPilde = async (id: string): Promise<PildeRecord> => {
  return pb.collection('pildes').getOne<PildeRecord>(id, {
    expand: 'topico_id,topico_id.materia_id',
  })
}
