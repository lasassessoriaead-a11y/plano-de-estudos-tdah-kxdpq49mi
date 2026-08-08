import pb from '@/lib/pocketbase/client'

export interface MateriaRecord {
  id: string
  nome: string
  icone?: string
  cor?: string
  peso?: number
  ordem?: number
}

export const getMaterias = async (): Promise<MateriaRecord[]> => {
  return pb.collection('materias').getFullList<MateriaRecord>({ sort: 'ordem' })
}
