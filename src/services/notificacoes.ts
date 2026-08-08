import pb from '@/lib/pocketbase/client'

export interface NotificacaoRecord {
  id: string
  usuario_id: string
  tipo: 'lembrete_estudo' | 'tarefa_nao_cumprida'
  destino?: string
  conteudo?: string
  data?: string
  status: 'pendente' | 'enviada'
  created: string
  updated: string
}

export const getNotificacoes = async (): Promise<NotificacaoRecord[]> => {
  return pb.collection('notificacoes').getFullList<NotificacaoRecord>({
    sort: '-created',
  })
}

export const updateNotificacao = async (
  id: string,
  data: Partial<NotificacaoRecord>,
): Promise<NotificacaoRecord> => {
  return pb.collection('notificacoes').update<NotificacaoRecord>(id, data)
}
