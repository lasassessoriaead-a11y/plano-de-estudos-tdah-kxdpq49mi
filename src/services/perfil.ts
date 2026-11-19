import pb from '@/lib/pocketbase/client'

// Coleção "perfil_estudo" — owner-only, criada na migração 0026.
export type ObjetivoEstudo =
  | 'enem'
  | 'vestibular'
  | 'faculdade_particular'
  | 'concurso'
  | 'multiplus'
export type NivelAtual = 'iniciante' | 'intermediario' | 'avancado'
export type EstiloExplicacao = 'resumido' | 'detalhado'
export type PreferenciaEstudo = 'questoes' | 'leitura' | 'mapas_mentais' | 'revisoes'

export interface PerfilEstudoRecord {
  id: string
  usuario_id: string
  objetivo: ObjetivoEstudo | ''
  instituicoes: string
  data_prova: string
  horas_por_dia: number
  materias_dificeis: string
  nivel_atual: NivelAtual | ''
  estilo_explicacao: EstiloExplicacao | ''
  preferencia_estudo: PreferenciaEstudo | ''
  onboarding_concluido: boolean
  created: string
  updated: string
}

export const OBJETIVO_LABELS: Record<ObjetivoEstudo, string> = {
  enem: 'ENEM',
  vestibular: 'Vestibular específico',
  faculdade_particular: 'Faculdade particular',
  concurso: 'Concurso público',
  multiplus: 'Mais de um objetivo',
}

export const NIVEL_LABELS: Record<NivelAtual, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export const PREFERENCIA_LABELS: Record<PreferenciaEstudo, string> = {
  questoes: 'Resolver questões',
  leitura: 'Leitura e teoria',
  mapas_mentais: 'Mapas mentais',
  revisoes: 'Revisões espaçadas',
}

export const getPerfilEstudo = async (userId: string): Promise<PerfilEstudoRecord | null> => {
  try {
    return await pb
      .collection('perfil_estudo')
      .getFirstListItem<PerfilEstudoRecord>(`usuario_id="${userId}"`)
  } catch {
    return null
  }
}

export const savePerfilEstudo = async (
  userId: string,
  data: Partial<PerfilEstudoRecord>,
): Promise<PerfilEstudoRecord> => {
  const existing = await getPerfilEstudo(userId)
  if (existing) {
    return pb.collection('perfil_estudo').update<PerfilEstudoRecord>(existing.id, data)
  }
  return pb.collection('perfil_estudo').create<PerfilEstudoRecord>({
    usuario_id: userId,
    ...data,
  })
}
