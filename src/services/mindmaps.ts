import pb from '@/lib/pocketbase/client'

export interface MindMapRecord {
  id: string
  titulo: string
  assunto: string
  materia: string
  favorito: boolean
  nivel_detalhe: string
  nivel_conhecimento: string
  foco: string
  created: string
  updated: string
}

export interface MindMapNodeRecord {
  id: string
  mapa_id: string
  chave: string
  rotulo: string
  detalhe: string
  nivel: number
  pai: string
  cor: string
  pos_x: number
  pos_y: number
  colapsado: boolean
}

export interface FullMindMap {
  mapa: MindMapRecord
  nos: MindMapNodeRecord[]
}

const BASE = '/api/collections'

function clean(params: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of Object.keys(params)) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      out[k] = String(params[k])
    }
  }
  return out
}

export async function listMindMaps(): Promise<MindMapRecord[]> {
  const res = await pb.send(`${BASE}/mind_maps/records`, {
    method: 'GET',
    query: {
      sort: '-updated',
      expand: '',
    },
  })
  return (res.items || []) as MindMapRecord[]
}

export async function getFullMindMap(mapaId: string): Promise<FullMindMap> {
  const mapa = (await pb.send(`${BASE}/mind_maps/records/${mapaId}`, {
    method: 'GET',
  })) as MindMapRecord
  const nos = await getMindMapNodes(mapaId)
  return { mapa, nos }
}

export async function getMindMapNodes(mapaId: string): Promise<MindMapNodeRecord[]> {
  const res = await pb.send(`${BASE}/mind_map_nodes/records`, {
    method: 'GET',
    query: {
      filter: `mapa_id="${mapaId}"`,
      sort: 'nivel,-created',
      perPage: 200,
    },
  })
  return (res.items || []) as MindMapNodeRecord[]
}

export async function createMindMap(dados: {
  titulo: string
  assunto: string
  materia: string
  nivel_detalhe: string
  nivel_conhecimento: string
  foco: string
}): Promise<MindMapRecord> {
  return (await pb.send(`${BASE}/mind_maps/records`, {
    method: 'POST',
    body: dados as unknown as Record<string, unknown>,
  })) as MindMapRecord
}

export async function updateMindMap(
  mapaId: string,
  dados: Partial<{
    titulo: string
    materia: string
    favorito: boolean
  }>,
): Promise<MindMapRecord> {
  return (await pb.send(`${BASE}/mind_maps/records/${mapaId}`, {
    method: 'PATCH',
    body: dados as unknown as Record<string, unknown>,
  })) as MindMapRecord
}

export async function deleteMindMap(mapaId: string): Promise<void> {
  await pb.send(`${BASE}/mind_maps/records/${mapaId}`, { method: 'DELETE' })
}

export async function duplicateMindMap(mapa: MindMapRecord): Promise<MindMapRecord | null> {
  try {
    const novo = await createMindMap({
      titulo: `${mapa.titulo} (cópia)`,
      assunto: mapa.assunto,
      materia: mapa.materia,
      nivel_detalhe: mapa.nivel_detalhe,
      nivel_conhecimento: mapa.nivel_conhecimento,
      foco: mapa.foco,
    })
    const originais = await getMindMapNodes(mapa.id)
    const clones = originais.map((n) => ({
      mapa_id: novo.id,
      chave: n.chave,
      rotulo: n.rotulo,
      detalhe: n.detalhe,
      nivel: n.nivel,
      pai: n.pai,
      cor: n.cor,
      pos_x: n.pos_x,
      pos_y: n.pos_y,
      colapsado: n.colapsado,
    }))
    await pb.send(`${BASE}/mind_map_nodes/records/batch`, {
      method: 'POST',
      body: {
        requests: clones.map((c) => ({
          method: 'POST',
          url: '/api/collections/mind_map_nodes/records',
          body: c,
        })),
      },
    })
    return novo
  } catch (err) {
    console.error('Erro ao duplicar mapa', err)
    return null
  }
}

export async function createNode(novo: {
  mapa_id: string
  chave: string
  rotulo: string
  detalhe: string
  nivel: number
  pai: string
  cor: string
  pos_x: number
  pos_y: number
}): Promise<MindMapNodeRecord> {
  return (await pb.send(`${BASE}/mind_map_nodes/records`, {
    method: 'POST',
    body: novo as unknown as Record<string, unknown>,
  })) as MindMapNodeRecord
}

export async function updateNode(
  nodeId: string,
  dados: Partial<{
    rotulo: string
    detalhe: string
    cor: string
    pos_x: number
    pos_y: number
    colapsado: boolean
  }>,
): Promise<void> {
  await pb.send(`${BASE}/mind_map_nodes/records/${nodeId}`, {
    method: 'PATCH',
    body: dados as unknown as Record<string, unknown>,
  })
}

export async function deleteNode(nodeId: string): Promise<void> {
  await pb.send(`${BASE}/mind_map_nodes/records/${nodeId}`, { method: 'DELETE' })
}

// ---------- chamadas de IA (backend/v1) ----------

export interface GerarMapaParams {
  acao: 'gerar' | 'expandir' | 'resumir' | 'explicar' | 'exemplos' | 'questoes' | 'flashcards'
  tema?: string
  materia?: string
  nivel_detalhe?: string
  nivel_conhecimento?: string
  foco?: string
  contexto?: string
  topico?: string
  conteudo_extra?: string
  texto_documento?: string
}

export interface NoIA {
  chave: string
  rotulo: string
  detalhe?: string
  nivel: number
  pai: string
  cor?: string
}

export interface RespostaIA {
  titulo?: string
  assunto?: string
  nos?: NoIA[]
  explicacao?: string
  questoes?: { enunciado: string; alternativas: string[]; gabarito: number; explicacao?: string }[]
  flashcards?: { frente: string; verso: string }[]
}

export async function chamarIA(params: GerarMapaParams): Promise<RespostaIA> {
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/mapas-ia`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify(params),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json && json.error ? json.error : 'Falha na comunicação com a IA')
  }
  return (json.data || {}) as RespostaIA
}

export async function importarDocumento(
  arquivo: File | null,
  texto: string,
): Promise<{ texto: string; truncado: boolean }> {
  const fd = new FormData()
  if (arquivo) fd.append('arquivo', arquivo)
  if (texto) fd.append('texto', texto)
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/mapas-importar`, {
    method: 'POST',
    headers: { Authorization: pb.authStore.token },
    body: fd,
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json && json.error ? json.error : 'Não consegui ler o documento')
  }
  return json.data || { texto: '', truncado: false }
}
