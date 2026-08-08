import pb from '@/lib/pocketbase/client'

export interface ProgressoRecord {
  id: string
  usuario_id: string
  missao_id: string
  etapa?: 'teoria' | 'pratica' | 'pausa'
  concluido?: boolean
  data?: string
}

export const getProgresso = async (missaoId?: string): Promise<ProgressoRecord[]> => {
  const filter = missaoId ? `missao_id="${missaoId}"` : ''
  return pb.collection('progresso').getFullList<ProgressoRecord>({ filter })
}

export const saveProgresso = async (data: Partial<ProgressoRecord>): Promise<ProgressoRecord> => {
  const usuario_id = pb.authStore.record?.id
  return pb.collection('progresso').create<ProgressoRecord>({
    ...data,
    usuario_id: data.usuario_id || usuario_id,
  })
}

export const updateProgresso = async (
  id: string,
  data: Partial<ProgressoRecord>,
): Promise<ProgressoRecord> => {
  return pb.collection('progresso').update<ProgressoRecord>(id, data)
}
