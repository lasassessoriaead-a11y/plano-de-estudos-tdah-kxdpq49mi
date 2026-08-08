import pb from '@/lib/pocketbase/client'
import { MateriaRecord } from './materias'
import { PildeRecord } from './pildes'

export interface QuestaoRecord {
  id: string
  enunciado: string
  alternativas: string[] | string
  gabarito: number
  explicacao?: string
  materia_id: string
  pildes_id?: string
  status?: 'pendente' | 'acertou' | 'errou'
  revisao_agendada?: string
  usuario_id: string
  expand?: {
    materia_id?: MateriaRecord
    pildes_id?: PildeRecord
  }
}

export const getQuestoes = async (): Promise<QuestaoRecord[]> => {
  return pb.collection('questoes').getFullList<QuestaoRecord>({
    expand: 'materia_id,pildes_id',
    sort: '-created',
  })
}

export const getQuestoesRevisao = async (): Promise<QuestaoRecord[]> => {
  return pb.collection('questoes').getFullList<QuestaoRecord>({
    filter: 'status="errou"',
    expand: 'materia_id,pildes_id',
    sort: 'revisao_agendada',
  })
}

export const getQuestoesByPilde = async (pildeId: string): Promise<QuestaoRecord[]> => {
  return pb.collection('questoes').getFullList<QuestaoRecord>({
    filter: `pildes_id="${pildeId}"`,
    expand: 'materia_id,pildes_id',
    sort: '-created',
  })
}

export const updateQuestao = async (
  id: string,
  data: Partial<QuestaoRecord>,
): Promise<QuestaoRecord> => {
  return pb.collection('questoes').update<QuestaoRecord>(id, data)
}

export const createQuestao = async (data: Partial<QuestaoRecord>): Promise<QuestaoRecord> => {
  return pb.collection('questoes').create<QuestaoRecord>(data)
}
