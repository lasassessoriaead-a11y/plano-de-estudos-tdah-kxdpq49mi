import pb from '@/lib/pocketbase/client'
import { MissaoRecord } from './missoes'

export interface RecompensaRecord {
  id: string
  usuario_id: string
  missao_id: string
  titulo: string
  tipo: 'dinheiro' | 'outro'
  valor?: number
  status: 'disponivel' | 'resgatada'
  created: string
  updated: string
  expand?: {
    missao_id?: MissaoRecord
  }
}

export const getRecompensas = async (): Promise<RecompensaRecord[]> => {
  return pb.collection('recompensas').getFullList<RecompensaRecord>({
    sort: '-created',
    expand: 'missao_id',
  })
}

export const getRecompensasMap = async (): Promise<Record<string, RecompensaRecord>> => {
  const list = await getRecompensas()
  const map: Record<string, RecompensaRecord> = {}
  for (const r of list) {
    map[r.missao_id] = r
  }
  return map
}

export const getRecompensaByMissao = async (missaoId: string): Promise<RecompensaRecord | null> => {
  try {
    return await pb
      .collection('recompensas')
      .getFirstListItem<RecompensaRecord>(`missao_id="${missaoId}"`)
  } catch {
    return null
  }
}

export const createRecompensa = async (
  data: Partial<RecompensaRecord>,
): Promise<RecompensaRecord> => {
  return pb.collection('recompensas').create<RecompensaRecord>(data)
}

export const updateRecompensa = async (
  id: string,
  data: Partial<RecompensaRecord>,
): Promise<RecompensaRecord> => {
  return pb.collection('recompensas').update<RecompensaRecord>(id, data)
}

export const deleteRecompensa = async (id: string): Promise<void> => {
  await pb.collection('recompensas').delete(id)
}
