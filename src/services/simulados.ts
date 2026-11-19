import pb from '@/lib/pocketbase/client'

// ---------- Tipos ----------

export type SimArea = 'linguagens' | 'humanas' | 'natureza' | 'matematica'

export const AREA_LABEL: Record<SimArea, string> = {
  linguagens: 'Linguagens',
  humanas: 'Ciências Humanas',
  natureza: 'Ciências da Natureza',
  matematica: 'Matemática',
}

export const AREAS: SimArea[] = ['linguagens', 'humanas', 'natureza', 'matematica']

export interface SimQuestaoRecord {
  id: string
  usuario_id: string
  enunciado: string
  alternativas: string[] | string
  gabarito: number
  resolucao?: string
  area: SimArea
  assunto?: string
  dificuldade?: 'facil' | 'medio' | 'dificil'
  ano?: number
  instituicao?: string
  origem?: string
  identificador?: string
  a?: number
  b?: number
  c?: number
}

export interface SimuladoConfig {
  area?: SimArea
  porArea?: Record<SimArea, number>
  dificuldade?: 'facil' | 'medio' | 'dificil' | 'todas'
  ano?: number | 'todos'
  instituicao?: string
  questoesPorArea?: number
}

export interface SimuladoRecord {
  id: string
  usuario_id: string
  titulo: string
  tipo: 'enem_dia1' | 'enem_dia2' | 'area' | 'personalizado'
  config_json: SimuladoConfig | string
  questoes_ids: string[] | string
  duracao_min: number
  incluir_redacao?: boolean
  tema_id?: string
  created: string
  updated: string
}

// ---------- Redação ----------

export interface TemaRedacaoRecord {
  id: string
  usuario_id: string
  titulo: string
  textos_motivadores: string[] | string
  instrucoes?: string
  created: string
  updated: string
}

export interface RedacaoCompetencia {
  codigo: number
  nota: number
  pontos_fortes: string
  a_melhorar: string
}

export interface RedacaoAvaliacao {
  competencias: RedacaoCompetencia[]
  soma?: number
  comentario_geral?: string
  avaliado_em?: string
}

export const COMPETENCIAS_REDACAO: { codigo: number; label: string }[] = [
  { codigo: 1, label: 'C1 — Domínio da escrita formal' },
  { codigo: 2, label: 'C2 — Compreensão do tema e repertório' },
  { codigo: 3, label: 'C3 — Seleção e organização dos argumentos' },
  { codigo: 4, label: 'C4 — Coesão e mecanismos linguísticos' },
  { codigo: 5, label: 'C5 — Proposta de intervenção' },
]

export interface TentativaRecord {
  id: string
  usuario_id: string
  simulado_id: string
  status: 'em_andamento' | 'finalizada' | 'abandonada'
  respostas_json: Record<string, number> | string
  marcadas_json?: string[] | string
  tempo_usado_seg?: number
  pct_acerto?: number
  redacao_texto?: string
  redacao_avaliacao?: RedacaoAvaliacao | string
  redacao_nota_real?: number | null
  iniciado_em?: string
  finalizado_em?: string
  created: string
  updated: string
  expand?: { simulado_id?: SimuladoRecord }
}

// ---------- Helpers ----------

const parseJson = <T>(v: T | string | undefined, fallback: T): T => {
  if (v === undefined || v === null) return fallback
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T
    } catch {
      return fallback
    }
  }
  return v
}

export const parseAlternativas = (q: SimQuestaoRecord): string[] => {
  const alt = parseJson<string[] | Record<string, string>>(q.alternativas as never, [])
  if (Array.isArray(alt)) return alt
  return Object.entries(alt)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

export const parseRespostas = (t: TentativaRecord): Record<string, number> =>
  parseJson<Record<string, number>>(t.respostas_json as never, {})

export const parseMarcadas = (t: TentativaRecord): string[] =>
  parseJson<string[]>(t.marcadas_json as never, [])

export const parseQuestoesIds = (s: SimuladoRecord): string[] =>
  parseJson<string[]>(s.questoes_ids as never, [])

export const parseConfig = (s: SimuladoRecord): SimuladoConfig =>
  parseJson<SimuladoConfig>(s.config_json as never, {})

export const parseTemaMotivadores = (t: TemaRedacaoRecord): string[] =>
  parseJson<string[]>(t.textos_motivadores as never, [])

export const parseAvaliacaoRedacao = (t: TentativaRecord): RedacaoAvaliacao | null => {
  const av = parseJson<RedacaoAvaliacao | null>(t.redacao_avaliacao as never, null)
  if (!av || !Array.isArray(av.competencias) || av.competencias.length !== 5) return null
  return av
}

export const somaAvaliacaoRedacao = (av: RedacaoAvaliacao): number =>
  av.competencias.reduce((acc, c) => acc + (Number(c.nota) || 0), 0)

// ---------- Banco de questões ----------

export const contarQuestoesDisponiveis = async (): Promise<number> => {
  return pb
    .collection('sim_questoes')
    .getFullList<SimQuestaoRecord>({ fields: 'id' })
    .then((r) => r.length)
}

interface FiltroBanco {
  area?: SimArea
  dificuldade?: 'facil' | 'medio' | 'dificil' | 'todas'
  ano?: number | 'todos'
  instituicao?: string
  busca?: string
}

const montarFiltro = (f: FiltroBanco): string => {
  const parts: string[] = []
  if (f.area) parts.push(`area="${f.area}"`)
  if (f.dificuldade && f.dificuldade !== 'todas') parts.push(`dificuldade="${f.dificuldade}"`)
  if (typeof f.ano === 'number') parts.push(`ano=${f.ano}`)
  if (f.instituicao) parts.push(`instituicao~"${f.instituicao}"`)
  return parts.join(' && ')
}

export const getQuestoesBanco = async (filtro: FiltroBanco = {}): Promise<SimQuestaoRecord[]> => {
  const filter = montarFiltro(filtro)
  return pb.collection('sim_questoes').getFullList<SimQuestaoRecord>({
    filter,
    sort: '-created',
  })
}

export const getAnosDisponiveis = async (): Promise<number[]> => {
  const recs = await pb.collection('sim_questoes').getFullList<SimQuestaoRecord>({ fields: 'ano' })
  return [...new Set(recs.map((r) => Number(r.ano)).filter(Boolean))].sort((a, b) => b - a)
}

// Seleção aleatória com filtro simples (montagem do simulado)
export const sortearQuestoes = async (
  filtro: FiltroBanco,
  quantidade: number,
): Promise<SimQuestaoRecord[]> => {
  const pool = await getQuestoesBanco(filtro)
  const embaralhado = [...pool]
  for (let i = embaralhado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[embaralhado[i], embaralhado[j]] = [embaralhado[j], embaralhado[i]]
  }
  return embaralhado.slice(0, quantidade)
}

export const getQuestoesByIds = async (ids: string[]): Promise<SimQuestaoRecord[]> => {
  if (!ids.length) return []
  const filtro = ids.map((id) => `id="${id}"`).join(' || ')
  const recs = await pb.collection('sim_questoes').getFullList<SimQuestaoRecord>({ filter: filtro })
  // preservar a ordem do simulado
  const mapa = new Map(recs.map((r) => [r.id, r]))
  return ids.map((id) => mapa.get(id)).filter((x): x is SimQuestaoRecord => Boolean(x))
}

// ---------- CRUD Simulados ----------

export interface CriarSimuladoData {
  titulo: string
  tipo: SimuladoRecord['tipo']
  config: SimuladoConfig
  questoesIds: string[]
  duracaoMin: number
  incluirRedacao?: boolean
  temaRedacaoId?: string
}

export const createSimulado = async (data: CriarSimuladoData): Promise<SimuladoRecord> => {
  const user = pb.authStore.record
  return pb.collection('simulados').create<SimuladoRecord>({
    usuario_id: user?.id,
    titulo: data.titulo,
    tipo: data.tipo,
    config_json: JSON.stringify(data.config),
    questoes_ids: JSON.stringify(data.questoesIds),
    duracao_min: data.duracaoMin,
    incluir_redacao: Boolean(data.incluirRedacao),
    tema_id: data.temaRedacaoId,
  })
}

export const getSimulado = async (id: string): Promise<SimuladoRecord> =>
  pb.collection('simulados').getOne<SimuladoRecord>(id)

export const listSimulados = async (): Promise<SimuladoRecord[]> =>
  pb.collection('simulados').getFullList<SimuladoRecord>({ sort: '-created' })

export const deleteSimulado = async (id: string): Promise<void> => {
  await pb.collection('simulados').delete(id)
}

// ---------- Temas de redação ----------

export const getTemaRedacao = async (id: string): Promise<TemaRedacaoRecord> =>
  pb.collection('sim_redacao_temas').getOne<TemaRedacaoRecord>(id)

// Primeiro tema disponível do aluno (usado no preset do 1º dia)
export const getPrimeiroTemaRedacao = async (): Promise<TemaRedacaoRecord | null> => {
  const recs = await pb
    .collection('sim_redacao_temas')
    .getList<TemaRedacaoRecord>(1, 1, { sort: '-created' })
  return recs.items[0] ?? null
}

// ---------- Tentativas ----------

export const criarTentativa = async (simuladoId: string): Promise<TentativaRecord> => {
  const user = pb.authStore.record
  return pb.collection('simulado_tentativas').create<TentativaRecord>({
    usuario_id: user?.id,
    simulado_id: simuladoId,
    status: 'em_andamento',
    respostas_json: JSON.stringify({}),
    marcadas_json: JSON.stringify([]),
    tempo_usado_seg: 0,
    iniciado_em: new Date().toISOString(),
  })
}

export const getTentativa = async (id: string): Promise<TentativaRecord> =>
  pb.collection('simulado_tentativas').getOne<TentativaRecord>(id)

export interface TentativaFiltro {
  simuladoId?: string
  status?: TentativaRecord['status']
}

export const listTentativas = async (filtro: TentativaFiltro = {}): Promise<TentativaRecord[]> => {
  const parts: string[] = []
  if (filtro.simuladoId) parts.push(`simulado_id="${filtro.simuladoId}"`)
  if (filtro.status) parts.push(`status="${filtro.status}"`)
  return pb.collection('simulado_tentativas').getFullList<TentativaRecord>({
    filter: parts.join(' && '),
    sort: '-created',
    expand: 'simulado_id',
  })
}

export const getTentativaEmAndamento = async (
  simuladoId: string,
): Promise<TentativaRecord | null> => {
  const lista = await listTentativas({ simuladoId, status: 'em_andamento' })
  return lista[0] ?? null
}

export interface SalvarTentativaData {
  respostas?: Record<string, number>
  marcadas?: string[]
  tempoUsadoSeg?: number
  status?: TentativaRecord['status']
  finalizadoEm?: string
  pctAcerto?: number
  redacaoTexto?: string
  notaRedacaoReal?: number
}

export const salvarTentativa = async (
  id: string,
  data: SalvarTentativaData,
): Promise<TentativaRecord> => {
  const body: Record<string, unknown> = {}
  if (data.respostas) body.respostas_json = JSON.stringify(data.respostas)
  if (data.marcadas) body.marcadas_json = JSON.stringify(data.marcadas)
  if (data.tempoUsadoSeg !== undefined) body.tempo_usado_seg = Math.round(data.tempoUsadoSeg)
  if (data.status) body.status = data.status
  if (data.finalizadoEm) body.finalizado_em = data.finalizadoEm
  if (data.pctAcerto !== undefined) body.pct_acerto = Math.round(data.pctAcerto)
  if (data.redacaoTexto !== undefined) body.redacao_texto = data.redacaoTexto
  if (data.notaRedacaoReal !== undefined) body.redacao_nota_real = Math.round(data.notaRedacaoReal)
  return pb.collection('simulado_tentativas').update<TentativaRecord>(id, body)
}

// ---------- Resultado ----------

export interface ResultadoArea {
  area: SimArea
  total: number
  respondidas: number
  acertos: number
  erros: number
  brancos: number
  pctAcerto: number
}

export interface ResultadoSimulado {
  total: number
  respondidas: number
  acertos: number
  erros: number
  brancos: number
  pctAcerto: number
  tempoSeg: number
  porArea: ResultadoArea[]
  // Estimativa não oficial baseada em acertos (NÃO é TRI oficial do INEP)
  estimativaNaoOficial: number | null
}

// Estimativa CLARAMENTE não oficial: aproximação linear de acertos
// (a TRI oficial do INEP exige parâmetros calibrados e não é reproduzível aqui).
export const estimarNotaNaoOficial = (acertos: number, total: number): number | null => {
  if (!total) return null
  return Math.round((acertos / total) * 1000)
}

export const calcularResultado = (
  questoes: SimQuestaoRecord[],
  respostas: Record<string, number>,
  tempoSeg: number,
): ResultadoSimulado => {
  const areas: SimArea[] = ['linguagens', 'humanas', 'natureza', 'matematica']
  const porArea: ResultadoArea[] = areas.map((area) => ({
    area,
    total: 0,
    respondidas: 0,
    acertos: 0,
    erros: 0,
    brancos: 0,
    pctAcerto: 0,
  }))

  let acertos = 0
  let erros = 0
  let brancos = 0

  for (const q of questoes) {
    const slot = porArea.find((p) => p.area === q.area)
    if (!slot) continue
    slot.total += 1
    const resp = respostas[q.id]
    if (resp === undefined || resp === null) {
      slot.brancos += 1
      brancos += 1
    } else if (Number(resp) === Number(q.gabarito)) {
      slot.acertos += 1
      slot.respondidas += 1
      acertos += 1
    } else {
      slot.erros += 1
      slot.respondidas += 1
      erros += 1
    }
  }

  const total = questoes.length
  const respondidas = acertos + erros
  for (const p of porArea) {
    p.pctAcerto = p.total ? Math.round((p.acertos / p.total) * 100) : 0
  }

  const temParametros = questoes.some((q) => q.b !== undefined && q.b !== null)

  return {
    total,
    respondidas,
    acertos,
    erros,
    brancos,
    pctAcerto: total ? Math.round((acertos / total) * 100) : 0,
    tempoSeg,
    porArea,
    // Quando houver parâmetros calibrados (b), a estimativa usa média simples ponderada;
    // quando não, é apenas a proporção de acertos — em ambos os casos NÃO é TRI oficial.
    estimativaNaoOficial: temParametros
      ? Math.round(
          (questoes.reduce(
            (acc, q) => acc + (respostas[q.id] === Number(q.gabarito) ? (q.b ?? 1) : 0),
            0,
          ) /
            Math.max(
              questoes.reduce((acc, q) => acc + (q.b ?? 1), 0),
              1,
            )) *
            1000,
        )
      : estimarNotaNaoOficial(acertos, total),
  }
}

// ---------- Formatadores ----------

export const formatarTempo = (seg: number): string => {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`
  return `${m}min ${String(s).padStart(2, '0')}s`
}

// ---------- Avaliação da redação (IA no backend) ----------

export const avaliarRedacao = async (tentativaId: string): Promise<RedacaoAvaliacao> => {
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/redacao-ia`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({ tentativa_id: tentativaId }),
  })
  const json = (await res.json().catch(() => null)) as {
    data?: RedacaoAvaliacao
    error?: string
  } | null
  if (!res.ok || !json?.data) {
    throw new Error(json?.error || 'Falha na avaliação da redação')
  }
  return json.data
}
