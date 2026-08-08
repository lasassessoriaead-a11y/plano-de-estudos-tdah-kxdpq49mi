import pb from '@/lib/pocketbase/client'
import { PildeRecord } from './pildes'

export interface MissaoRecord {
  id: string
  usuario_id: string
  data: string
  titulo: string
  pildes_id: string
  ordem?: number
  status?: 'pendente' | 'em_andamento' | 'concluida'
  expand?: {
    pildes_id?: PildeRecord
  }
}

export const getMissoesData = async (dataStr: string): Promise<MissaoRecord[]> => {
  return pb.collection('missoes').getFullList<MissaoRecord>({
    filter: `data~"${dataStr}"`,
    expand: 'pildes_id,pildes_id.topico_id,pildes_id.topico_id.materia_id',
    sort: 'ordem',
  })
}

export const updateMissao = async (
  id: string,
  data: Partial<MissaoRecord>,
): Promise<MissaoRecord> => {
  return pb.collection('missoes').update<MissaoRecord>(id, data)
}

export const createMissao = async (data: Partial<MissaoRecord>): Promise<MissaoRecord> => {
  return pb.collection('missoes').create<MissaoRecord>(data)
}
