// Integração com a Google Agenda do usuário conectado (modo "cada usuário
// conecta a própria conta", via skipConnectors). Nada aqui é fake: toda
// criação de evento passa por `execute` e fala com a API real do Google.
import { execute, listConnectors, type ConnectorStatus } from '@/lib/skipConnectors'

const TOOLKIT = 'googlecalendar'

/** Status da conexão do Google Agenda para o usuário logado. */
export const getStatusGoogleAgenda = async (): Promise<ConnectorStatus | null> => {
  const all = await listConnectors()
  return all.find((c) => c.toolkit === TOOLKIT)?.status ?? null
}

export interface TarefaAgenda {
  /** Título exibido no evento, sem o prefixo NEXORA. */
  titulo: string
  /** Nome da matéria (vai no título). */
  materia?: string
  /** Duração em minutos (padrão 15). */
  duracaoMin?: number
}

export interface EventoGoogle {
  id: string
  summary: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

/** Extrai a lista de eventos de qualquer formato que o Google devolva. */
const extrairEventos = (data: unknown): EventoGoogle[] => {
  if (!isRecord(data)) return []
  const candidatos: unknown[] = []
  if (Array.isArray(data.items)) candidatos.push(...data.items)
  if (Array.isArray(data.events)) candidatos.push(...data.events)
  if (Array.isArray(data.event_data)) candidatos.push(...data.event_data)
  if (isRecord(data.event_data) && Array.isArray(data.event_data.event_data))
    candidatos.push(...data.event_data.event_data)
  return candidatos.filter(isRecord).map((e) => ({
    id: typeof e.id === 'string' ? e.id : '',
    summary: typeof e.summary === 'string' ? e.summary : '',
    start: isRecord(e.start) ? (e.start as EventoGoogle['start']) : undefined,
  }))
}

const PREFIXO = 'NEXORA — '

export const tituloEvento = (materia: string | undefined, titulo: string): string =>
  `${PREFIXO}${materia ? `${materia}: ` : ''}${titulo}`

// ---------- Janela de estudo (horários baseados no perfil do usuário) ----------

export interface JanelaEstudo {
  /** Início da janela em minutos desde a meia-noite. */
  inicioMin: number
  /** Fim da janela em minutos desde a meia-noite. */
  fimMin: number
}

const MIN_POR_HORA = 60

/**
 * Janela de estudo do dia: começa às 8h (ou agora, se já passou) e termina
 * `horasPorDia` depois — a janela de estudo configurada no onboarding.
 * Nunca começa depois das 22h nem termina depois da meia-noite.
 */
export const janelaDoDia = (horasPorDia: number, agora = new Date()): JanelaEstudo => {
  const inicioMin = Math.min(
    Math.max(8 * MIN_POR_HORA, agora.getHours() * MIN_POR_HORA + agora.getMinutes()),
    22 * MIN_POR_HORA,
  )
  const fimMin = Math.min(inicioMin + Math.max(1, horasPorDia) * MIN_POR_HORA, 24 * MIN_POR_HORA)
  return { inicioMin, fimMin: Math.max(inicioMin + 30, fimMin) }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "YYYY-MM-DDTHH:mm:ss±HH:MM" (RFC3339) — o Google exige o offset do fuso. */
const minParaHora = (data: Date, minutos: number): string => {
  const d = new Date(data)
  d.setHours(Math.floor(minutos / MIN_POR_HORA), minutos % MIN_POR_HORA, 0, 0)
  const offsetMin = -d.getTimezoneOffset()
  const sinal = offsetMin >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMin)
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:00` +
    `${sinal}${pad(Math.floor(absOffset / MIN_POR_HORA))}:${pad(absOffset % MIN_POR_HORA)}`
  )
}

// ---------- Sincronização ----------

export interface ResultadoSync {
  criados: number
  duplicados: number
}

export interface OpcoesSync {
  tarefas: TarefaAgenda[]
  /** "YYYY-MM-DD" do dia planejado (normalmente hoje). */
  dia: string
  /** Horas de estudo por dia configuradas no onboarding. */
  horasPorDia: number
  /** Data da próxima prova, se houver — vira um evento de prova full-width. */
  proximaProva?: { titulo: string; data: string } | null
}

const dataEhHoje = (dia: string, agora = new Date()): boolean =>
  dia === `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Sincroniza as tarefas do dia com a Google Agenda do usuário conectado.
 * Lê os eventos já existentes no intervalo do dia, evita duplicar títulos
 * idênticos (com ou sem prefixo NEXORA) e cria os que faltam, escalonados
 * dentro da janela de estudo. Lança quando algo falha — nunca silencia.
 */
export const sincronizarComGoogleAgenda = async (
  opcoes: OpcoesSync,
  agora = new Date(),
): Promise<ResultadoSync> => {
  const { tarefas, dia, horasPorDia, proximaProva } = opcoes
  const pendencias: TarefaAgenda[] = tarefas.filter((t) => t.titulo.trim().length > 0)
  if (pendencias.length === 0 && !proximaProva?.data) return { criados: 0, duplicados: 0 }

  const diaObj = new Date(`${dia}T12:00:00`)
  const janela = janelaDoDia(
    horasPorDia,
    dataEhHoje(dia, agora) ? agora : new Date(`${dia}T08:00:00`),
  )

  // 1) Leitura primeiro: se falhar ou vier inesperado, paramos ANTES de escrever.
  const leitura = await execute('GOOGLECALENDAR_EVENTS_LIST', {
    calendarId: 'primary',
    timeMin: minParaHora(diaObj, 0),
    timeMax: minParaHora(diaObj, 24 * MIN_POR_HORA - 1),
    singleEvents: true,
    maxResults: 100,
  })
  if (!leitura.successful) throw new Error(leitura.error || 'Falha ao ler a agenda')
  const existentes = extrairEventos(leitura.data)
  if (existentes.length === 0 && !isRecord(leitura.data))
    throw new Error('Resposta inesperada da Google Agenda')

  // 2) Dedup: título idêntico já existente no dia (com ou sem prefixo).
  const resumoExistentes = existentes.map((e) => e.summary)
  const jaExiste = (summary: string) => resumoExistentes.some((s) => norm(s) === norm(summary))

  // 3) Escala os eventos novos pela janela de estudo.
  const duracaoPadrao = 15
  let cursor = janela.inicioMin
  const novos: { summary: string; start: string; end: string }[] = []
  const encaixar = (summary: string, duracaoMin: number) => {
    const dur = Math.min(Math.max(duracaoMin, 10), 120)
    if (cursor + dur > janela.fimMin) cursor = Math.max(janela.inicioMin, janela.fimMin - dur)
    const start = minParaHora(diaObj, cursor)
    const end = minParaHora(diaObj, cursor + dur)
    cursor += dur
    novos.push({ summary, start, end })
  }

  let duplicados = 0
  for (const t of pendencias) {
    const summary = tituloEvento(t.materia, t.titulo)
    if (jaExiste(summary)) {
      duplicados++
      continue
    }
    encaixar(summary, t.duracaoMin ?? duracaoPadrao)
  }

  // Próxima prova: evento próprio no dia marcado, 09:00–13:00 (padrão ENEM).
  if (proximaProva?.data) {
    const summary = tituloEvento(undefined, proximaProva.titulo)
    const provaObj = new Date(`${proximaProva.data}T12:00:00`)
    if (!isNaN(provaObj.getTime()) && !jaExiste(summary)) {
      novos.push({
        summary,
        start: minParaHora(provaObj, 9 * MIN_POR_HORA),
        end: minParaHora(provaObj, 13 * MIN_POR_HORA),
      })
    } else if (jaExiste(summary)) {
      duplicados++
    }
  }

  if (novos.length === 0) return { criados: 0, duplicados }

  // 4) Criação: um por um, com dedup garantido pela leitura feita antes.
  // Slug confirmado via find_app_connector_tools (toolkit googlecalendar):
  // GOOGLECALENDAR_CREATE_EVENT({ calendar_id?, summary?, start_datetime?,
  // end_datetime? }) — datas em RFC3339 com offset, formato de minParaHora.
  let criados = 0
  for (const ev of novos) {
    const r = await execute('GOOGLECALENDAR_CREATE_EVENT', {
      calendar_id: 'primary',
      summary: ev.summary,
      start_datetime: ev.start,
      end_datetime: ev.end,
    })
    if (!r.successful) throw new Error(r.error || 'Falha ao criar evento na agenda')
    criados++
  }

  return { criados, duplicados }
}
