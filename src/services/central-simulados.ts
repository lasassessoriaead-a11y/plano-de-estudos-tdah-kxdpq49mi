import pb from '@/lib/pocketbase/client'

// ---------- Central de Simulados Inteligentes NEXORA ----------

export type CategoriaSim =
  | 'enem'
  | 'vestibular'
  | 'faculdade_particular'
  | 'universidade_publica'
  | 'concurso'
  | 'personalizados'
  | 'ia'
  | 'provas_anteriores'

export type ModoProva = 'prova_anterior' | 'base_provas_reais' | 'inedito_ia' | 'misto'

export const MODO_LABEL: Record<ModoProva, string> = {
  prova_anterior: 'Prova anterior completa',
  base_provas_reais: 'Baseado em provas reais',
  inedito_ia: 'Inédito por IA',
  misto: 'Misto (oficiais + IA)',
}

export const MODO_DESC: Record<ModoProva, string> = {
  prova_anterior:
    'A prova completa de uma instituição/banca/ano, montada a partir das questões de provas anteriores no banco.',
  base_provas_reais: 'A IA seleciona questões REAIS (de provas anteriores) do banco, no seu foco.',
  inedito_ia:
    'A IA cria questões ORIGINAIS no estilo da instituição/banca — sempre marcadas como geradas por IA, nunca oficiais.',
  misto:
    'Uma combinação: parte das questões vem de provas reais e parte é inédita por IA. Você vê a quantidade e a origem de cada tipo antes de começar.',
}

export const TIPO_QUESTAO_LABEL: Record<string, string> = {
  multipla_escolha: 'Múltipla escolha',
  certo_errado: 'Certo/Errado',
  discursiva: 'Discursiva',
}

export interface InstituicaoRecord {
  id: string
  nome: string
  sigla?: string
  categoria: 'vestibular' | 'faculdade_particular' | 'universidade_publica' | 'concurso'
  tipo?: 'publica' | 'particular'
  bancas?: string
  descricao?: string
  formato_json?: Record<string, unknown> | string
  cursos?: string
  ativa?: boolean
  created: string
  expand?: Record<string, never>
}

export interface BancaRecord {
  id: string
  nome: string
  estilo?: 'multipla_escolha' | 'certo_errado' | 'discursiva' | 'misto'
  descricao?: string
}

export interface ProvaAnteriorRecord {
  id: string
  instituicao: string
  banca?: string
  ano: number
  fase?: string
  curso_cargo?: string
  titulo: string
  materias?: string
  total_questoes?: number
  duracao_min?: number
  ativo?: boolean
}

export interface QuestaoExpandidaRecord {
  id: string
  usuario_id: string
  enunciado: string
  alternativas: string[] | string
  gabarito: number
  gabarito_texto?: string
  resolucao?: string
  materia?: string
  assunto?: string
  tipo_questao: 'multipla_escolha' | 'certo_errado' | 'discursiva'
  dificuldade?: 'facil' | 'medio' | 'dificil'
  ano?: number
  instituicao?: string
  banca?: string
  curso_cargo?: string
  fonte?: string
  origem: 'oficial_autorizada' | 'gerada_ia'
  aprovada?: boolean
  hash_duplicata?: string
}

// Questão "achatada" dentro de uma prova (prova_ia.questoes_json)
export interface QuestaoProva {
  id: string
  materia: string
  assunto?: string
  tipo_questao: 'multipla_escolha' | 'certo_errado' | 'discursiva'
  enunciado: string
  alternativas: string[]
  gabarito: number
  gabarito_texto?: string
  resolucao?: string
  dificuldade?: string
  origem: 'oficial_autorizada' | 'gerada_ia'
  fonte?: string
  instituicao?: string
  banca?: string
  ano?: number
}

export interface ProvaIaRecord {
  id: string
  usuario_id: string
  titulo: string
  instituicao?: string
  banca?: string
  curso_cargo?: string
  modo: ModoProva
  config_json: Record<string, unknown> | string
  questoes_json: QuestaoProva[] | string
  qtd_oficiais?: number
  qtd_ia?: number
  duracao_min: number
  status: 'gerando' | 'pronta' | 'erro'
  erro_msg?: string
  created: string
  updated: string
}

export interface TentativaIaRecord {
  id: string
  usuario_id: string
  prova_ia_id: string
  status: 'em_andamento' | 'finalizada' | 'abandonada'
  respostas_json: Record<string, string> | string
  marcadas_json?: string[] | string
  tempo_usado_seg?: number
  iniciado_em?: string
  finalizado_em?: string
  pct_acerto?: number
  resultado_json?: Record<string, unknown> | string
  analise_ia?: AnaliseIa | string | null
  favorita?: boolean
  created: string
  updated: string
  expand?: { prova_ia_id?: ProvaIaRecord }
}

export interface AnaliseIa {
  erros_principais: string[]
  padroes: string[]
  recomendacoes: string[]
  nova_prova_direcionada?: {
    materias: string[]
    qtd_sugerida?: number
    dificuldade?: string
  }
}

export interface ConfigProvaIa {
  instituicao?: string
  banca?: string
  curso_cargo?: string
  materias?: string[]
  qtd_questoes?: number
  dificuldade?: 'facil' | 'medio' | 'dificil' | 'todas'
  duracao_min?: number
  ano_referencia?: number
  fase?: string
  qtd_ia?: number
  titulo?: string
}

// ---------- Instituições / bancas / provas (catálogo global) ----------

export const listInstituicoes = async (): Promise<InstituicaoRecord[]> =>
  pb.collection('sim_instituicoes').getFullList<InstituicaoRecord>({ sort: 'nome' })

export const getInstituicao = async (id: string): Promise<InstituicaoRecord> =>
  pb.collection('sim_instituicoes').getOne<InstituicaoRecord>(id)

export const listBancas = async (): Promise<BancaRecord[]> =>
  pb.collection('sim_bancas').getFullList<BancaRecord>({ sort: 'nome' })

export const listProvasAnteriores = async (instituicao?: string): Promise<ProvaAnteriorRecord[]> =>
  pb.collection('sim_provas').getFullList<ProvaAnteriorRecord>({
    filter: instituicao ? `instituicao="${instituicao}"` : '',
    sort: '-ano',
  })

// ---------- Questões expandidas ----------

export interface FiltroQuestoesExp {
  materia?: string
  instituicao?: string
  banca?: string
  tipo_questao?: string
  dificuldade?: string
  origem?: string
  ano?: number
  busca?: string
}

export const listQuestoesExpandidas = async (
  f: FiltroQuestoesExp = {},
): Promise<QuestaoExpandidaRecord[]> => {
  const parts: string[] = []
  if (f.materia) parts.push(`materia~"${f.materia}"`)
  if (f.instituicao) parts.push(`instituicao~"${f.instituicao}"`)
  if (f.banca) parts.push(`banca~"${f.banca}"`)
  if (f.tipo_questao) parts.push(`tipo_questao="${f.tipo_questao}"`)
  if (f.dificuldade) parts.push(`dificuldade="${f.dificuldade}"`)
  if (f.origem) parts.push(`origem="${f.origem}"`)
  if (f.ano) parts.push(`ano=${f.ano}`)
  return pb.collection('sim_questoes_expandidas').getFullList<QuestaoExpandidaRecord>({
    filter: parts.join(' && '),
    sort: '-created',
  })
}

// busca inteligente (texto livre em vários campos)
export const buscarNoBanco = async (
  termo: string,
): Promise<{
  simulados: ProvaIaRecord[]
  provas: ProvaAnteriorRecord[]
  instituicoes: InstituicaoRecord[]
  questoes: QuestaoExpandidaRecord[]
}> => {
  const t = termo.trim()
  if (!t) return { simulados: [], provas: [], instituicoes: [], questoes: [] }
  const [sims, provas, insts, questoes] = await Promise.all([
    pb.collection('sim_provas_ia').getFullList<ProvaIaRecord>({
      filter: `titulo~"${t}" || instituicao~"${t}" || banca~"${t}" || curso_cargo~"${t}"`,
      sort: '-created',
    }),
    pb.collection('sim_provas').getFullList<ProvaAnteriorRecord>({
      filter: `titulo~"${t}" || instituicao~"${t}" || banca~"${t}" || materias~"${t}" || ano=${isNaN(Number(t)) ? 0 : Number(t)}`,
      sort: '-ano',
    }),
    pb.collection('sim_instituicoes').getFullList<InstituicaoRecord>({
      filter: `nome~"${t}" || sigla~"${t}" || cursos~"${t}" || bancas~"${t}"`,
      sort: 'nome',
    }),
    pb.collection('sim_questoes_expandidas').getFullList<QuestaoExpandidaRecord>({
      filter: `enunciado~"${t}" || materia~"${t}" || assunto~"${t}" || instituicao~"${t}" || banca~"${t}" || ano=${isNaN(Number(t)) ? 0 : Number(t)}`,
      sort: '-created',
    }),
  ])
  return { simulados: sims, provas, instituicoes: insts, questoes }
}

// ---------- Provas IA ----------

export interface CriarProvaIaData {
  modo: ModoProva
  config: ConfigProvaIa
}

export const gerarProvaIa = async (
  data: CriarProvaIaData,
): Promise<{ prova_id: string; aviso: string; qtd_oficiais: number; qtd_ia: number }> => {
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/sim-gerar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify(data),
  })
  const json = (await res.json().catch(() => null)) as {
    data?: { prova_id: string; aviso: string; qtd_oficiais: number; qtd_ia: number }
    error?: string
  } | null
  if (!res.ok || !json?.data) throw new Error(json?.error || 'Falha ao gerar a prova')
  return json.data
}

export const getProvaIa = async (id: string): Promise<ProvaIaRecord> =>
  pb.collection('sim_provas_ia').getOne<ProvaIaRecord>(id)

export const listProvasIa = async (): Promise<ProvaIaRecord[]> =>
  pb.collection('sim_provas_ia').getFullList<ProvaIaRecord>({ sort: '-created' })

export const deleteProvaIa = async (id: string): Promise<void> => {
  await pb.collection('sim_provas_ia').delete(id)
}

export const parseQuestoesProva = (p: ProvaIaRecord): QuestaoProva[] => {
  const raw =
    typeof p.questoes_json === 'string' ? p.questoes_json : JSON.stringify(p.questoes_json ?? [])
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

export const parseConfigProva = (p: ProvaIaRecord): ConfigProvaIa => {
  try {
    const raw =
      typeof p.config_json === 'string' ? p.config_json : JSON.stringify(p.config_json ?? {})
    return JSON.parse(raw) as ConfigProvaIa
  } catch {
    return {}
  }
}

// ---------- Tentativas das provas da central ----------

export interface CriarTentativaIaData {
  prova_ia_id: string
}

export const criarTentativaIa = async (provaIaId: string): Promise<TentativaIaRecord> => {
  const user = pb.authStore.record
  return pb.collection('sim_tentativas_ia').create<TentativaIaRecord>({
    usuario_id: user?.id,
    prova_ia_id: provaIaId,
    status: 'em_andamento',
    respostas_json: JSON.stringify({}),
    marcadas_json: JSON.stringify([]),
    tempo_usado_seg: 0,
    iniciado_em: new Date().toISOString(),
  })
}

export const getTentativaIa = async (id: string): Promise<TentativaIaRecord> =>
  pb.collection('sim_tentativas_ia').getOne<TentativaIaRecord>(id)

export interface TentativaIaFiltro {
  provaId?: string
  status?: TentativaIaRecord['status']
}

export const listTentativasIa = async (
  filtro: TentativaIaFiltro = {},
): Promise<TentativaIaRecord[]> => {
  const parts: string[] = []
  if (filtro.provaId) parts.push(`prova_ia_id="${filtro.provaId}"`)
  if (filtro.status) parts.push(`status="${filtro.status}"`)
  return pb.collection('sim_tentativas_ia').getFullList<TentativaIaRecord>({
    filter: parts.join(' && '),
    sort: '-created',
    expand: 'prova_ia_id',
  })
}

export const getTentativaIaEmAndamento = async (
  provaId: string,
): Promise<TentativaIaRecord | null> => {
  const lista = await listTentativasIa({ provaId, status: 'em_andamento' })
  return lista[0] ?? null
}

export interface SalvarTentativaIaData {
  respostas?: Record<string, string>
  marcadas?: string[]
  tempoUsadoSeg?: number
  status?: TentativaIaRecord['status']
  finalizadoEm?: string
  pctAcerto?: number
  resultadoJson?: Record<string, unknown>
  favorita?: boolean
}

export const salvarTentativaIa = async (
  id: string,
  data: SalvarTentativaIaData,
): Promise<TentativaIaRecord> => {
  const body: Record<string, unknown> = {}
  if (data.respostas) body.respostas_json = JSON.stringify(data.respostas)
  if (data.marcadas) body.marcadas_json = JSON.stringify(data.marcadas)
  if (data.tempoUsadoSeg !== undefined) body.tempo_usado_seg = Math.round(data.tempoUsadoSeg)
  if (data.status) body.status = data.status
  if (data.finalizadoEm) body.finalizado_em = data.finalizadoEm
  if (data.pctAcerto !== undefined) body.pct_acerto = Math.round(data.pctAcerto)
  if (data.resultadoJson) body.resultado_json = JSON.stringify(data.resultadoJson)
  if (data.favorita !== undefined) body.favorita = data.favorita
  return pb.collection('sim_tentativas_ia').update<TentativaIaRecord>(id, body)
}

// ---------- Resultado / correção ----------

export interface ResultadoQuestao {
  questao: QuestaoProva
  resposta: string | null
  correta: boolean | null // null = em branco
}

export interface ResultadoMateria {
  materia: string
  total: number
  acertos: number
  erros: number
  brancos: number
  pct: number
}

export interface ResultadoCentral {
  total: number
  respondidas: number
  acertos: number
  erros: number
  brancos: number
  pctAcerto: number
  tempoSeg: number
  porMateria: ResultadoMateria[]
  porTipo: { tipo: string; total: number; acertos: number }[]
  porOrigem: { origem: 'oficial_autorizada' | 'gerada_ia'; total: number; acertos: number }[]
  questoes: ResultadoQuestao[]
}

// correção central: MC e certo/errado corrigem por índice; discursiva fica
// como "aguardando correção" (não pontua automaticamente — IA dá o gabarito esperado)
export const corrigirProva = (
  questoes: QuestaoProva[],
  respostas: Record<string, string>,
  tempoSeg: number,
): ResultadoCentral => {
  const materiasMap = new Map<string, ResultadoMateria>()
  const tipoMap = new Map<string, { tipo: string; total: number; acertos: number }>()
  const origemMap = new Map<
    string,
    { origem: 'oficial_autorizada' | 'gerada_ia'; total: number; acertos: number }
  >()

  let acertos = 0
  let erros = 0
  let brancos = 0
  const det: ResultadoQuestao[] = []

  for (const q of questoes) {
    const m = q.materia || 'Geral'
    if (!materiasMap.has(m)) {
      materiasMap.set(m, { materia: m, total: 0, acertos: 0, erros: 0, brancos: 0, pct: 0 })
    }
    const slotM = materiasMap.get(m)!
    slotM.total += 1

    const tipo = q.tipo_questao || 'multipla_escolha'
    if (!tipoMap.has(tipo)) tipoMap.set(tipo, { tipo, total: 0, acertos: 0 })
    const slotT = tipoMap.get(tipo)!
    slotT.total += 1

    const origem = q.origem || 'oficial_autorizada'
    if (!origemMap.has(origem)) {
      origemMap.set(origem, { origem, total: 0, acertos: 0 })
    }
    const slotO = origemMap.get(origem)!
    slotO.total += 1

    const resp = respostas[q.id]
    let correta: boolean | null = null
    if (resp === undefined || resp === null || resp === '') {
      slotM.brancos += 1
      brancos += 1
    } else if (tipo === 'discursiva') {
      correta = null // sem correção automática
      slotM.brancos += 1
      brancos += 1
    } else if (Number(resp) === Number(q.gabarito)) {
      correta = true
      slotM.acertos += 1
      slotT.acertos += 1
      slotO.acertos += 1
      acertos += 1
    } else {
      correta = false
      slotM.erros += 1
      erros += 1
    }
    det.push({ questao: q, resposta: resp ?? null, correta })
  }

  const porMateria = [...materiasMap.values()].map((m) => ({
    ...m,
    pct: m.total ? Math.round((m.acertos / m.total) * 100) : 0,
  }))

  const total = questoes.length
  return {
    total,
    respondidas: acertos + erros,
    acertos,
    erros,
    brancos,
    pctAcerto: total ? Math.round((acertos / total) * 100) : 0,
    tempoSeg,
    porMateria,
    porTipo: [...tipoMap.values()],
    porOrigem: [...origemMap.values()],
    questoes: det,
  }
}

// ---------- Análise IA do resultado ----------

export const analisarResultadoIa = async (tentativaId: string): Promise<AnaliseIa> => {
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/sim-analise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({
      tentativa_id: tentativaId,
      erros: undefined,
    }),
  })
  const json = (await res.json().catch(() => null)) as { data?: AnaliseIa; error?: string } | null
  if (!res.ok || !json?.data) throw new Error(json?.error || 'Falha na análise IA')
  return json.data
}

// ---------- Editais ----------

export interface EditalRecord {
  id: string
  usuario_id: string
  titulo: string
  orgao?: string
  banca?: string
  arquivo?: string
  status: 'enviado' | 'processando' | 'processado' | 'erro'
  disciplinas_json?: Record<string, unknown> | string
  erro_msg?: string
  created: string
  collectionId?: string
  collectionName?: string
}

export const createEdital = async (
  titulo: string,
  arquivo: File,
  orgao?: string,
  banca?: string,
): Promise<EditalRecord> => {
  const user = pb.authStore.record
  const fd = new FormData()
  fd.append('usuario_id', user?.id ?? '')
  fd.append('titulo', titulo)
  if (orgao) fd.append('orgao', orgao)
  if (banca) fd.append('banca', banca)
  fd.append('arquivo', arquivo)
  fd.append('status', 'enviado')
  return pb.collection('sim_editais').create<EditalRecord>(fd)
}

export const listEditais = async (): Promise<EditalRecord[]> =>
  pb.collection('sim_editais').getFullList<EditalRecord>({ sort: '-created' })

export const processarEdital = async (
  editalId: string,
): Promise<{
  cargo?: string
  escolaridade?: string
  disciplinas: { nome: string; assuntos: string[] }[]
}> => {
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/sim-edital`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({ edital_id: editalId }),
  })
  const json = (await res.json().catch(() => null)) as {
    data?: {
      cargo?: string
      escolaridade?: string
      disciplinas: { nome: string; assuntos: string[] }[]
    }
    error?: string
  } | null
  if (!res.ok || !json?.data) throw new Error(json?.error || 'Falha ao processar o edital')
  return json.data
}

export const parseDisciplinasEdital = (
  e: EditalRecord,
): {
  cargo?: string
  escolaridade?: string
  disciplinas: { nome: string; assuntos: string[] }[]
} | null => {
  try {
    const raw =
      typeof e.disciplinas_json === 'string'
        ? e.disciplinas_json
        : JSON.stringify(e.disciplinas_json ?? null)
    const v = JSON.parse(raw)
    return v && Array.isArray(v.disciplinas) ? v : null
  } catch {
    return null
  }
}

// url do arquivo de edital (para download/visualização)
export const urlArquivoEdital = (e: EditalRecord): string =>
  e.arquivo
    ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/sim_editais/${e.id}/${e.arquivo}`
    : ''

// ---------- Histórico / favoritos ----------

export const alternarFavorita = async (tentativa: TentativaIaRecord): Promise<TentativaIaRecord> =>
  salvarTentativaIa(tentativa.id, { favorita: !tentativa.favorita })

// ---------- Recomendações ----------

export interface Recomendacao {
  titulo: string
  motivo: string
  modo: ModoProva
  instituicao?: string
  banca?: string
  materias?: string[]
  dificuldade?: string
  qtd?: number
}

export const recomendar = async (): Promise<Recomendacao[]> => {
  const [tentativas, provas] = await Promise.all([
    listTentativasIa({ status: 'finalizada' }),
    listProvasIa(),
  ])
  const recs: Recomendacao[] = []
  const materiasFracas = new Map<string, number>() // materia -> pct (mínima)

  for (const t of tentativas) {
    try {
      const raw =
        typeof t.resultado_json === 'string'
          ? t.resultado_json
          : JSON.stringify(t.resultado_json ?? {})
      const r = JSON.parse(raw) as { porMateria?: ResultadoMateria[] }
      for (const m of r.porMateria ?? []) {
        if (!materiasFracas.has(m.materia) || (materiasFracas.get(m.materia) ?? 0) > m.pct) {
          materiasFracas.set(m.materia, m.pct)
        }
      }
    } catch {
      /* resultado_json corrompido — ignora */
    }
  }

  const fracas = [...materiasFracas.entries()].sort((a, b) => a[1] - b[1]).slice(0, 2)

  if (fracas.length) {
    for (const [materia, pct] of fracas) {
      recs.push({
        titulo: `Treino focado — ${materia}`,
        motivo: `Seu desempenho em ${materia} está em ${pct}%. Um treino inédito de IA ajuda a fixar.`,
        modo: 'inedito_ia',
        materias: [materia],
        qtd: 10,
        dificuldade: 'medio',
      })
    }
  }

  if (!recs.length) {
    recs.push({
      titulo: 'Primeiro treino com IA',
      motivo: 'Ainda sem histórico: comece com um treino de 10 questões inéditas de IA.',
      modo: 'inedito_ia',
      qtd: 10,
      dificuldade: 'medio',
    })
    recs.push({
      titulo: 'ENEM — dia completo',
      motivo: 'Teste seu nível em uma prova real completa do ENEM.',
      modo: 'prova_anterior',
      instituicao: 'ENEM / INEP',
      banca: 'ENEM',
      qtd: 30,
    })
  }

  // instituições mais presentes no histórico
  const instCount = new Map<string, number>()
  for (const p of provas) {
    if (p.instituicao) instCount.set(p.instituicao, (instCount.get(p.instituicao) ?? 0) + 1)
  }
  const instTop = [...instCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 1)
  for (const [inst] of instTop) {
    recs.push({
      titulo: `Refinar ${inst}`,
      motivo: `Você já fez provas de ${inst}. Reforce com uma nova prova baseada em questões reais.`,
      modo: 'base_provas_reais',
      instituicao: inst,
      qtd: 15,
    })
  }
  return recs
}
