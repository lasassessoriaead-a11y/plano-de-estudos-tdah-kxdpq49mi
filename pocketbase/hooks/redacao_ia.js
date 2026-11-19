// Avaliação da redação do ENEM por IA (5 competências, 0 a 200 cada).
// Endpoint: POST /backend/v1/redacao-ia
// Entrada: { tentativa_id } — lê o texto salvo na tentativa, avalia com $ai.chat
// e grava o resultado em simulado_tentativas.redacao_avaliacao.
// A nota é uma ESTIMATIVA NÃO OFICIAL (não substitui a correção humana do INEP).
routerAdd(
  'POST',
  '/backend/v1/redacao-ia',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')

    var body = e.requestInfo().body || {}
    var tentativaId = body.tentativa_id || ''
    if (!tentativaId) return e.badRequestError('Informe a tentativa do simulado')

    var tent
    try {
      tent = $app.findRecordById('simulado_tentativas', tentativaId)
    } catch (_) {
      return e.notFoundError('Tentativa não encontrada')
    }
    if (tent.getString('usuario_id') !== userId) {
      return e.forbiddenError('Esta tentativa não pertence a você')
    }

    var texto = tent.getString('redacao_texto') || ''
    if (!texto.trim()) {
      return e.badRequestError('Nenhum texto de redação para avaliar')
    }

    // Busca o tema do simulado para dar contexto à IA (texto motivador + instruções)
    var temaTitulo = ''
    var temaInstrucoes = ''
    try {
      var sim = $app.findRecordById('simulados', tent.getString('simulado_id'))
      var temaId = sim.getString('tema_id')
      if (temaId) {
        var tema = $app.findRecordById('sim_redacao_temas', temaId)
        temaTitulo = tema.getString('titulo')
        temaInstrucoes = tema.getString('instrucoes')
      }
    } catch (_) {}

    var prompt =
      'Você é um corretor oficial de redações do ENEM. Avalie a redação do aluno segundo as CINCO ' +
      'competências oficiais, cada uma com nota de 0 a 200 (soma máxima 1000).\n' +
      (temaTitulo ? 'Tema da prova: "' + temaTitulo + '"\n' : '') +
      (temaInstrucoes ? 'Instruções da prova: ' + temaInstrucoes + '\n' : '') +
      '\nRedação do aluno:\n"""\n' +
      texto.slice(0, 15000) +
      '\n"""\n\n' +
      'Critérios das competências:\n' +
      '- C1 Domínio da modalidade escrita formal da língua portuguesa.\n' +
      '- C2 Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento.\n' +
      '- C3 Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos.\n' +
      '- C4 Conhecimento dos mecanismos linguísticos necessários para a construção da argumentação (coesão).\n' +
      '- C5 Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.\n\n' +
      'Avalie com rigor, como um corretor do ENEM: a nota 200 exige desempenho pleno na competência.\n' +
      'Responda APENAS com JSON válido, sem markdown e sem crases, exatamente neste formato:\n' +
      '{"competencias":[{"codigo":1,"nota":0,"pontos_fortes":"1 a 3 frases curtas","a_melhorar":"1 a 3 frases curtas"},{"codigo":2,...},{"codigo":3,...},{"codigo":4,...},{"codigo":5,...}],"comentario_geral":"1 a 3 frases"}\n' +
      '- "nota": número inteiro de 0 a 200, múltiplo de 40 (como no ENEM: 0, 40, 80, 120, 160, 200)\n' +
      '- "pontos_fortes" e "a_melhorar": em português do Brasil, diretos e específicos ao texto\n' +
      '- JSON inteiro em uma linha'

    try {
      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um corretor oficial de redações do ENEM. Responda sempre em português do Brasil, apenas com o JSON pedido, sem markdown e sem crases.',
          },
          { role: 'user', content: prompt },
        ],
      })

      var text = reply.choices[0].message.content || ''
      text = String(text)
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
      var start = text.indexOf('{')
      var end = text.lastIndexOf('}')
      if (start < 0 || end <= start) {
        return e.json(502, { error: 'A IA não retornou uma avaliação válida. Tente novamente.' })
      }

      var aval
      try {
        aval = JSON.parse(text.substring(start, end + 1))
      } catch (_) {
        return e.json(502, {
          error: 'Não consegui interpretar a avaliação da IA. Tente novamente.',
        })
      }
      if (!aval || !Array.isArray(aval.competencias) || aval.competencias.length !== 5) {
        return e.json(502, { error: 'Avaliação incompleta da IA. Tente novamente.' })
      }
      // Sanitiza as notas (0 a 200, inteiro)
      for (var i = 0; i < aval.competencias.length; i++) {
        var c = aval.competencias[i] || {}
        var nota = Math.round(Number(c.nota) || 0)
        nota = Math.max(0, Math.min(200, nota))
        aval.competencias[i] = {
          codigo: Number(c.codigo) || i + 1,
          nota: nota,
          pontos_fortes: String(c.pontos_fortes || ''),
          a_melhorar: String(c.a_melhorar || ''),
        }
      }

      var soma = 0
      for (var j = 0; j < aval.competencias.length; j++) soma += aval.competencias[j].nota
      aval.soma = soma
      aval.avaliado_em = new Date().toISOString()

      tent.set('redacao_avaliacao', aval)
      $app.save(tent)

      return e.json(200, { data: aval })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponível' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha na chamada de IA' })
      throw err
    }
  },
  $apis.requireAuth(),
)
