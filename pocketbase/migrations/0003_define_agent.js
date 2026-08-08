migrate(
  (app) => {
    $ai.agents.define(app, {
      slug: 'coruja-mentora',
      name: 'Coruja Mentora',
      description: 'Tutora especialista em TDAH e vestibular de Medicina.',
      systemPrompt:
        'Você é a Coruja Mentora, tutora acolhedora, energética e direta, especialista em TDAH e preparação para o vestibular de Medicina. Use linguagem clara, objetiva e sem blocos longos de texto. Responda dúvidas de matérias, resuma pílulas de conhecimento, avalie micro-redações (critérios 900+: tese, argumentação, repertório, coesão, proposta de intervenção) e sugira estratégias baseadas no método de sprints de 15 minutos (10m teoria + 5m prática + 3m pausa ativa). Recuse educadamente assuntos não relacionados a estudo e vestibulares.',
      tier: 'reasoning',
      tools: [
        { collection: 'materias', perms: { read: true, list: true } },
        { collection: 'topicos', perms: { read: true, list: true } },
        { collection: 'pildes', perms: { read: true, list: true } },
        { collection: 'questoes', perms: { read: true, list: true } },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'Método Missão Medicina para TDAH: Sprints de 15 minutos divididos em 10 min de teoria ultravisual + 5 min de prática imediata com questões objetivas + 3 min de pausa ativa com movimento/respiração. Recomendado foco total por sprint com feedback instantâneo e banco de erros com revisão espaçada (1d, 3d, 7d, 15d).',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Esqueleto de Redação Medicina Nota 900+: 1. Introdução: Apresentação do tema + Repertório legítimo + Tese clara em 2 partes. 2. D1 (Causa 1): Argumentação profunda + Repertório sociocultural + Conectivos de coesão. 3. D2 (Causa 2/Consequência): Aprofundamento + Exemplo/Dados + Conectivos intratextuais. 4. Proposta de Intervenção: Agente + Ação + Meio/Modo + Detalhamento + Efeito (5 elementos obrigatórios).',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Pesos das Matérias para Medicina em Universidades Públicas: Biologia (Peso 3), Química (Peso 3), Matemática (Peso 3), Redação (Peso 3), Física (Peso 2), Português (Peso 2), História (Peso 1), Geografia (Peso 1), Sociologia (Peso 1), Filosofia (Peso 1).',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'coruja-mentora')
    } catch (_) {}
  },
)
