import pb from '@/lib/pocketbase/client'

export interface ConfigAlertaRecord {
  id: string
  usuario_id: string
  whatsapp_responsavel?: string
  whatsapp_aluno?: string
  horario_lembrete?: string
  horario_verificacao?: string
  created: string
  updated: string
}

export const getConfigAlertas = async (): Promise<ConfigAlertaRecord | null> => {
  try {
    return await pb
      .collection('config_alertas')
      .getFirstListItem<ConfigAlertaRecord>(`usuario_id="${pb.authStore.record?.id}"`)
  } catch {
    return null
  }
}

export const createConfigAlertas = async (
  data: Partial<ConfigAlertaRecord>,
): Promise<ConfigAlertaRecord> => {
  return pb.collection('config_alertas').create<ConfigAlertaRecord>(data)
}

export const updateConfigAlertas = async (
  id: string,
  data: Partial<ConfigAlertaRecord>,
): Promise<ConfigAlertaRecord> => {
  return pb.collection('config_alertas').update<ConfigAlertaRecord>(id, data)
}
