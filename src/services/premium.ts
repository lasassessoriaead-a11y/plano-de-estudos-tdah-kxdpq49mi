import pb from '@/lib/pocketbase/client'

// ---------- user_preferences ----------
export interface UserPreferencesRecord {
  id: string
  usuario_id: string
  meta_diaria_min: number
  meta_semanal_min: number
  tema: 'dark' | 'light' | ''
  notificacoes_email: boolean
  created: string
  updated: string
  expand?: { usuario_id?: { name?: string; role?: string } }
}

export const getUserPreferences = async (userId: string): Promise<UserPreferencesRecord | null> => {
  try {
    return await pb
      .collection('user_preferences')
      .getFirstListItem<UserPreferencesRecord>(`usuario_id="${userId}"`)
  } catch {
    return null
  }
}

export const saveUserPreferences = async (
  userId: string,
  data: Partial<UserPreferencesRecord>,
): Promise<UserPreferencesRecord> => {
  const existing = await getUserPreferences(userId)
  if (existing) {
    return pb.collection('user_preferences').update<UserPreferencesRecord>(existing.id, data)
  }
  return pb.collection('user_preferences').create<UserPreferencesRecord>({
    usuario_id: userId,
    ...data,
  })
}

// ---------- study_sessions ----------
export interface StudySessionRecord {
  id: string
  usuario_id: string
  data: string
  minutos: number
  tipo: 'teoria' | 'pratica' | 'revisao' | 'livre' | ''
  materia_id: string
  missao_id: string
  created: string
}

export const createStudySession = async (data: Partial<StudySessionRecord>) => {
  return pb.collection('study_sessions').create<StudySessionRecord>(data)
}

export const getStudySessions = async (userId: string): Promise<StudySessionRecord[]> => {
  return pb.collection('study_sessions').getFullList<StudySessionRecord>({
    filter: `usuario_id="${userId}"`,
    sort: '-data',
  })
}

// ---------- notifications ----------
export interface NotificationRecord {
  id: string
  usuario_id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'lembrete' | 'conquista' | 'alerta' | 'revisao' | ''
  lida: boolean
  link: string
  created: string
  updated: string
}

export const getNotifications = async (userId: string): Promise<NotificationRecord[]> => {
  return pb.collection('notifications').getFullList<NotificationRecord>({
    filter: `usuario_id="${userId}"`,
    sort: '-created',
  })
}

export const markNotificationRead = async (id: string, lida = true) => {
  return pb.collection('notifications').update<NotificationRecord>(id, { lida })
}

export const markAllNotificationsRead = async (records: NotificationRecord[]) => {
  await Promise.all(records.filter((r) => !r.lida).map((r) => markNotificationRead(r.id, true)))
}

export const createNotification = async (data: Partial<NotificationRecord>) => {
  return pb.collection('notifications').create<NotificationRecord>(data)
}

// ---------- MPC: mpc_contents ----------
export interface MpcContentRecord {
  id: string
  topico_id: string
  materia_id: string
  subassunto: string
  nome: string
  descricao: string
  dificuldade: number
  importancia_enem: number
  created: string
  updated: string
  expand?: { topico_id?: { nome: string; materia_id: string } }
}

export const getMpcContents = async (): Promise<MpcContentRecord[]> => {
  return pb.collection('mpc_contents').getFullList<MpcContentRecord>({
    expand: 'topico_id,materia_id',
    sort: '-created',
  })
}

// ---------- MPC: content_progress ----------
export type ContentStatus =
  | 'nao_iniciado'
  | 'planejado'
  | 'em_andamento'
  | 'estudado'
  | 'em_revisao'
  | 'dominado'

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  nao_iniciado: 'Não iniciado',
  planejado: 'Planejado',
  em_andamento: 'Em andamento',
  estudado: 'Estudado',
  em_revisao: 'Em revisão',
  dominado: 'Dominado',
}

export interface ContentProgressRecord {
  id: string
  usuario_id: string
  conteudo_id: string
  materia_id: string
  topico_id: string
  status: ContentStatus | ''
  nivel_dominio: number
  observacoes: string
  dificuldades: string
  prioridade: number
  questoes_realizadas: number
  questoes_acertadas: number
  ultima_data_estudo: string
  proxima_revisao: string
  created: string
  updated: string
  expand?: { conteudo_id?: MpcContentRecord }
}

export const getContentProgress = async (userId: string): Promise<ContentProgressRecord[]> => {
  return pb.collection('content_progress').getFullList<ContentProgressRecord>({
    filter: `usuario_id="${userId}"`,
    sort: '-updated',
  })
}

export const upsertContentProgress = async (
  userId: string,
  conteudoId: string,
  data: Partial<ContentProgressRecord>,
): Promise<ContentProgressRecord> => {
  let existing: ContentProgressRecord | null = null
  try {
    existing = await pb
      .collection('content_progress')
      .getFirstListItem<ContentProgressRecord>(
        `usuario_id="${userId}" && conteudo_id="${conteudoId}"`,
      )
  } catch {
    existing = null
  }
  if (existing) {
    return pb.collection('content_progress').update<ContentProgressRecord>(existing.id, data)
  }
  return pb.collection('content_progress').create<ContentProgressRecord>({
    usuario_id: userId,
    conteudo_id: conteudoId,
    ...data,
  })
}

// ---------- métricas agregadas (dashboard) ----------
export const getMissoesConcluidas = async (userId: string) => {
  return pb.collection('missoes').getFullList({
    filter: `usuario_id="${userId}" && status="concluida"`,
    sort: '-data',
  })
}

export const getQuestoesUsuario = async (userId: string) => {
  return pb.collection('questoes').getFullList({
    filter: `usuario_id="${userId}"`,
    sort: '-created',
  })
}
