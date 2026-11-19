// Central de Simulados Inteligentes NEXORA — hooks de IA.
// Endpoints:
//   POST /backend/v1/sim-gerar       — monta prova (4 modos) no banco do usuário
//   POST /backend/v1/sim-analise     — análise IA do resultado de uma tentativa
//   POST /backend/v1/sim-edital      — extrai disciplinas de um edital (PDF) enviado
// Regras:
//   - tudo owner-only: usa e.auth.id
//   - se a IA não estiver disponível (SkipAiConfigError), retorna 503 com aviso
//     honesto — NUNCA dados falsos.
//   - questões geradas por IA são SEMPRE gravadas com origem='gerada_ia'.
routerAdd(
  'POST',
  '/backend/v1/sim-gerar',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')

    var body = e.requestInfo().body || {}
    var modo = String(body.modo || '') // prova_anterior | base_provas_reais | inedito_ia | misto
    var config = body.config || {}
    if (!['prova_anterior', 'base_provas_reais', 'inedito_ia', 'misto'].includes(modo)) {
      return e.badRequestError('Modo inválido')
    }

    var instituicao = String(config.instituicao || '')
    var banca = String(config.banca || '')
    var cursoCargo = String(config.curso_cargo || '')
    var materias = Array.isArray(config.materias) ? config.materias : []
    var qtd = Math.max(1, Math.min(120, Number(config.qtd_questoes) || 20))
    var dificuldade = String(config.dificuldade || 'todas') // facil|medio|dificil|todas
    var duracaoMin = Math.max(5, Math.min(600, Number(config.duracao_min) || qtd * 3))
    var anoRef = Number(config.ano_referencia) || 0
    var fase = String(config.fase || '')
    var qtdIaDesejada = Math.max(0, Math.min(qtd, Number(config.qtd_ia) || 0))

    // ---------- helper: puxa questões aprovadas do banco expandido ----------
    var puxarQuestoes = function (filtros, limite) {
      var parts = ['aprovada=true']
      if (filtros.instituicao) parts.push('instituicao~"' + filtros.instituicao + '"')
      if (filtros.banca) parts.push('banca~"' + filtros.banca + '"')
      if (filtros.materia) parts.push('materia~"' + filtros.materia + '"')
      if (filtros.tipo_questao) parts.push('tipo_questao="' + filtros.tipo_questao + '"')
      if (filtros.ano) parts.push('ano=' + filtros.ano)
      var list = $app.findRecordsByFilter(
        'sim_questoes_expandidas',
        parts.join(' && '),
        '-created',
        Math.min(limite * 4, 400),
        0,
      )
      // embaralha e corta
      for (var i = list.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1))
        var tmp = list[i]
        list[i] = list[j]
        list[j] = tmp
      }
      return list.slice(0, limite)
    }

    // ---------- helper: chama IA para gerar questões inéditas ----------
    var gerarQuestoesIA = function (materia, quantidade, tipo, dific) {
      var prompt =
        'Gere ' +
        quantidade +
        ' questões INÉDITAS de "' +
        materia +
        '" para um simulado' +
        (instituicao
          ? ' no estilo de provas da instituição/banca "' +
            (instituicao + (banca ? ' / ' + banca : '')) +
            '"'
          : '') +
        (cursoCargo ? ' para o curso/cargo "' + cursoCargo + '"' : '') +
        (anoRef ? ' com nível de referência de ' + anoRef : '') +
        (dific && dific !== 'todas' ? ', dificuldade ' + dific : '') +
        '.\n' +
        (tipo === 'certo_errado'
          ? 'Formato: cada questão é do tipo CERTO/ERRADO — enunciado + 1 afirmação a julgar; gabarito 1 = Certo, 2 = Errado.\n'
          : tipo === 'discursiva'
            ? 'Formato: questão discursiva — enunciado aberto; gabarito_texto = resposta esperada em 3 a 8 linhas.\n'
            : 'Formato: múltipla escolha com 5 alternativas (A–E); gabarito = índice 0–4 da correta.\n') +
        (materias && materias.length ? 'Matérias possíveis: ' + materias.join(', ') + '.\n' : '') +
        'REGRAS OBRIGATÓRIAS:\n' +
        '- Questões ORIGINAIS, nunca copiadas de provas oficiais.\n' +
        '- Cada questão precisa ter resolução comentada de 2 a 6 frases.\n' +
        '- Conteúdo escolar/universitário real de "' +
        materia +
        '" (não invente disciplina).\n' +
        'Responda APENAS com JSON válido, sem markdown, sem crases, em uma linha:\n' +
        '{"questoes":[{"materia":"' +
        materia +
        '","assunto":"...","tipo_questao":"' +
        (tipo || 'multipla_escolha') +
        '","enunciado":"...","alternativas":["...","..."],"gabarito":0,"gabarito_texto":"","resolucao":"...","dificuldade":"medio"}]}'

      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um elaborador de provas brasileiro. Escreve em português do Brasil, com rigor técnico, e responde apenas com o JSON pedido, sem markdown e sem crases.',
          },
          { role: 'user', content: prompt },
        ],
      })

      var text = String(reply.choices[0].message.content || '')
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
      var start = text.indexOf('{')
      var end = text.lastIndexOf('}')
      if (start < 0 || end <= start) throw new Error('IA não retornou JSON válido')
      var parsed = JSON.parse(text.substring(start, end + 1))
      if (!parsed || !Array.isArray(parsed.questoes)) throw new Error('JSON da IA sem questões')
      return parsed.questoes
    }

    // ---------- helper: grava questão IA no banco do usuário ----------
    var salvarQuestaoIA = function (q, provaId) {
      var tipo = ['multipla_escolha', 'certo_errado', 'discursiva'].includes(q.tipo_questao)
        ? q.tipo_questao
        : 'multipla_escolha'
      var gab = Number(q.gabarito)
      if (tipo === 'certo_errado') gab = Math.max(0, Math.min(1, isNaN(gab) ? 0 : gab))
      else if (tipo === 'discursiva') gab = -1
      else gab = Math.max(0, Math.min(4, isNaN(gab) ? 0 : gab))

      var alts = q.alternativas
      if (!Array.isArray(alts) || !alts.length) {
        if (tipo === 'certo_errado') alts = ['Certo', 'Errado']
        else if (tipo === 'discursiva') alts = []
        else
          alts = [
            'Alternativa A',
            'Alternativa B',
            'Alternativa C',
            'Alternativa D',
            'Alternativa E',
          ]
      }

      var rec = new Record($app.findCollectionByNameOrId('sim_questoes_expandidas'))
      rec.set('usuario_id', userId)
      rec.set('enunciado', String(q.enunciado || '').slice(0, 11999))
      rec.set('alternativas', JSON.stringify(alts))
      rec.set('gabarito', gab)
      rec.set('gabarito_texto', String(q.gabarito_texto || '').slice(0, 7999))
      rec.set('resolucao', String(q.resolucao || '').slice(0, 199999))
      rec.set('materia', String(q.materia || 'Geral').slice(0, 159))
      rec.set('assunto', String(q.assunto || '').slice(0, 299))
      rec.set('tipo_questao', tipo)
      rec.set(
        'dificuldade',
        ['facil', 'medio', 'dificil'].includes(q.dificuldade) ? q.dificuldade : 'medio',
      )
      rec.set('ano', anoRef || new Date().getFullYear())
      rec.set('instituicao', instituicao)
      rec.set('banca', banca)
      rec.set('curso_cargo', cursoCargo)
      rec.set('fonte', 'NEXORA AI — questões inéditas geradas por IA')
      rec.set('origem', 'gerada_ia')
      rec.set('aprovada', true) // visível só para o próprio usuário (owner-only + aprovada)
      rec.set('gerada_por_simulado_id', provaId)
      app.save(rec)
      return rec
    }

    // ---------- Montagem por modo ----------
    var questoesOficiais = []
    var questoesIA = []
    var aviso = ''

    try {
      if (modo === 'prova_anterior') {
        // prova anterior completa por instituição/banca/ano: puxa do banco (sem IA)
        questoesOficiais = puxarQuestoes(
          { instituicao: instituicao, banca: banca, ano: anoRef || 0 },
          qtd,
        )
        if (!questoesOficiais.length) {
          return e.json(422, {
            error:
              'Ainda não há questões de provas anteriores dessa instituição/banca no banco. Use "Criar prova com IA" (questões inéditas no estilo) ou aguarde a importação de provas.',
          })
        }
      } else if (modo === 'base_provas_reais') {
        // IA seleciona questões do banco considerando os filtros do usuário
        questoesOficiais = puxarQuestoes(
          {
            instituicao: instituicao,
            banca: banca,
            materia: materias[0] || '',
            tipo_questao: '',
            ano: 0,
          },
          qtd,
        )
        if (!questoesOficiais.length) {
          return e.json(422, {
            error:
              'O banco de questões reais ainda não tem material suficiente para esses filtros. Tente outro filtro ou o modo "Prova inédita por IA".',
          })
        }
        // ordena por dificuldade pedida
        if (dificuldade !== 'todas') {
          questoesOficiais = questoesOficiais.filter(function (r) {
            return r.getString('dificuldade') === dificuldade
          })
          if (!questoesOficiais.length) {
            return e.json(422, {
              error: 'Sem questões reais nessa dificuldade para os filtros escolhidos.',
            })
          }
        }
      } else if (modo === 'inedito_ia' || modo === 'misto') {
        var qtdIa = modo === 'inedito_ia' ? qtd : qtdIaDesejada
        var qtdOficiais = modo === 'misto' ? Math.max(0, qtd - qtdIa) : 0
        if (modo === 'misto' && qtdOficiais > 0) {
          questoesOficiais = puxarQuestoes(
            { instituicao: instituicao, banca: banca, materia: materias[0] || '', ano: 0 },
            qtdOficiais,
          )
          qtdOficiais = questoesOficiais.length
        }
        var feitas = 0
        var materiasAlvo = materias.length ? materias : ['Geral']
        var tentativasErro = 0
        while (feitas < qtdIa && tentativasErro < 3) {
          try {
            var restantes = qtdIa - feitas
            var m = materiasAlvo[feitas % materiasAlvo.length]
            var lote = gerarQuestoesIA(m, Math.min(6, restantes), '', dificuldade)
            for (var k = 0; k < lote.length && feitas < qtdIa; k++) {
              var recq = salvarQuestaoIA(lote[k], '')
              questoesIA.push(recq)
              feitas++
            }
          } catch (errIA) {
            tentativasErro++
            if (errIA instanceof SkipAiConfigError) throw errIA
            if (tentativasErro >= 3) {
              aviso =
                'Parte das questões de IA não pôde ser gerada (' +
                feitas +
                ' de ' +
                qtdIa +
                ' concluídas). A prova segue com o que foi gerado.'
              break
            }
          }
        }
        if (modo === 'misto') qtdIaDesejada = feitas
      }

      // ---------- monta a prova ----------
      var questoesFinal = []
      for (var oi = 0; oi < questoesOficiais.length; oi++) {
        var qr = questoesOficiais[oi]
        questoesFinal.push({
          id: qr.id,
          banco: 'expandido',
          materia: qr.getString('materia'),
          assunto: qr.getString('assunto'),
          tipo_questao: qr.getString('tipo_questao'),
          enunciado: qr.getString('enunciado'),
          alternativas: JSON.parse(qr.getString('alternativas') || '[]'),
          gabarito: qr.getInt('gabarito', -1),
          gabarito_texto: qr.getString('gabarito_texto'),
          resolucao: qr.getString('resolucao'),
          dificuldade: qr.getString('dificuldade'),
          origem: qr.getString('origem'),
          fonte: qr.getString('fonte'),
          instituicao: qr.getString('instituicao'),
          banca: qr.getString('banca'),
          ano: qr.getInt('ano', 0),
        })
      }
      for (var ii = 0; ii < questoesIA.length; ii++) {
        var qi = questoesIA[ii]
        questoesFinal.push({
          id: qi.id,
          banco: 'expandido',
          materia: qi.getString('materia'),
          assunto: qi.getString('assunto'),
          tipo_questao: qi.getString('tipo_questao'),
          enunciado: qi.getString('enunciado'),
          alternativas: JSON.parse(qi.getString('alternativas') || '[]'),
          gabarito: qi.getInt('gabarito', -1),
          gabarito_texto: qi.getString('gabarito_texto'),
          resolucao: qi.getString('resolucao'),
          dificuldade: qi.getString('dificuldade'),
          origem: 'gerada_ia',
          fonte: 'NEXORA AI — questões inéditas geradas por IA',
          instituicao: instituicao,
          banca: banca,
          ano: anoRef || new Date().getFullYear(),
        })
      }

      if (!questoesFinal.length) {
        return e.json(422, { error: 'Nenhuma questão foi montada para os filtros escolhidos.' })
      }

      var titulo =
        String(config.titulo || '') ||
        (instituicao || 'Simulado') + (banca ? ' — ' + banca : '') + (fase ? ' (' + fase + ')' : '')

      var prova = new Record($app.findCollectionByNameOrId('sim_provas_ia'))
      prova.set('usuario_id', userId)
      prova.set('titulo', titulo.slice(0, 249))
      prova.set('instituicao', instituicao)
      prova.set('banca', banca)
      prova.set('curso_cargo', cursoCargo)
      prova.set('modo', modo)
      prova.set(
        'config_json',
        JSON.stringify({
          materias: materias,
          dificuldade: dificuldade,
          qtd_questoes: questoesFinal.length,
          qtd_ia_solicitada: qtdIaDesejada,
          ano_referencia: anoRef,
          fase: fase,
        }),
      )
      prova.set('questoes_json', JSON.stringify(questoesFinal))
      prova.set('qtd_oficiais', questoesOficiais.length)
      prova.set('qtd_ia', questoesIA.length)
      prova.set('duracao_min', duracaoMin)
      prova.set('status', 'pronta')
      if (aviso) prova.set('erro_msg', aviso)
      app.save(prova)

      return e.json(200, {
        data: {
          prova_id: prova.id,
          aviso: aviso,
          qtd_oficiais: questoesOficiais.length,
          qtd_ia: questoesIA.length,
        },
      })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        return e.json(503, {
          error: 'IA temporariamente indisponível. Tente novamente mais tarde.',
        })
      }
      if (err instanceof SkipAiError) {
        return e.json(502, { error: 'Falha na chamada de IA. Tente novamente.' })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/sim-analise',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')

    var body = e.requestInfo().body || {}
    var tentativaId = String(body.tentativa_id || '')
    if (!tentativaId) return e.badRequestError('Informe a tentativa')

    var tent
    try {
      tent = $app.findRecordById('sim_tentativas_ia', tentativaId)
    } catch (_) {
      return e.notFoundError('Tentativa não encontrada')
    }
    if (tent.getString('usuario_id') !== userId)
      return e.forbiddenError('Tentativa não pertence a você')
    if (tent.getString('status') !== 'finalizada')
      return e.badRequestError('Finalize a prova antes de analisar')

    // monta o resumo a partir do resultado_json
    var resumo = {}
    try {
      resumo = JSON.parse(tent.getString('resultado_json') || '{}')
    } catch (_) {}
    var prova
    try {
      prova = $app.findRecordById('sim_provas_ia', tent.getString('prova_ia_id'))
    } catch (_) {}

    var detalheErros = Array.isArray(body.erros) ? body.erros.slice(0, 30) : []
    var descErros = detalheErros.length
      ? detalheErros
          .map(function (er) {
            return (
              '- [' +
              (er.materia || '?') +
              (er.assunto ? ' / ' + er.assunto : '') +
              '] ' +
              String(er.enunciado || '').slice(0, 220)
            )
          })
          .join('\n')
      : '(sem detalhes de erros)'

    var prompt =
      'Analise o desempenho do aluno em um simulado e devolva um diagnóstico de estudo.\n' +
      'Simulado: ' +
      (prova ? prova.getString('titulo') : 'simulado') +
      '\n' +
      'Instituição/banca: ' +
      (prova ? prova.getString('instituicao') + ' / ' + prova.getString('banca') : '—') +
      '\n' +
      'Total de questões: ' +
      (resumo.total || '?') +
      '\n' +
      'Acertos: ' +
      (resumo.acertos || 0) +
      ' | Erros: ' +
      (resumo.erros || 0) +
      ' | Em branco: ' +
      (resumo.brancos || 0) +
      '\n' +
      'Percentual de acerto: ' +
      (resumo.pctAcerto || 0) +
      '%\n' +
      'Desempenho por matéria: ' +
      JSON.stringify(resumo.porMateria || {}) +
      '\n' +
      'Questões erradas (matéria / assunto / início do enunciado):\n' +
      descErros +
      '\n\n' +
      'Responda APENAS com JSON válido, sem markdown e sem crases, em uma linha:\n' +
      '{"erros_principais":["..."],"padroes":["..."],"recomendacoes":["..."],"nova_prova_direcionada":{"materias":["..."],"qtd_sugerida":10,"dificuldade":"medio"}}\n' +
      '- erros_principais: 3 a 5 itens, cada um citando matéria/assunto e o tipo de erro.\n' +
      '- padroes: 2 a 4 padrões identificados (ex.: queda em interpretação, erros de sinal, temas recorrentes).\n' +
      '- recomendacoes: 3 a 5 ações concretas de estudo.\n' +
      '- nova_prova_direcionada: matérias para focar na próxima prova, quantidade e dificuldade sugeridas.'

    try {
      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um mentor de estudos brasileiro. Analisa desempenho em simulados e responde sempre em português do Brasil, apenas com o JSON pedido, sem markdown e sem crases.',
          },
          { role: 'user', content: prompt },
        ],
      })

      var text = String(reply.choices[0].message.content || '')
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
      var start = text.indexOf('{')
      var end = text.lastIndexOf('}')
      if (start < 0 || end <= start)
        return e.json(502, { error: 'A IA não retornou uma análise válida.' })

      var analise = JSON.parse(text.substring(start, end + 1))
      if (!analise || !Array.isArray(analise.erros_principais)) {
        return e.json(502, { error: 'Análise incompleta da IA. Tente novamente.' })
      }
      // salva na tentativa para o histórico consultar depois
      tent.set('analise_ia', analise)
      $app.save(tent)

      return e.json(200, { data: analise })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponível' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha na chamada de IA' })
      throw err
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/sim-edital',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')

    var body = e.requestInfo().body || {}
    var editalId = String(body.edital_id || '')
    if (!editalId) return e.badRequestError('Informe o edital')

    var edital
    try {
      edital = $app.findRecordById('sim_editais', editalId)
    } catch (_) {
      return e.notFoundError('Edital não encontrado')
    }
    if (edital.getString('usuario_id') !== userId)
      return e.forbiddenError('Edital não pertence a você')

    var arquivo = edital.getString('arquivo')
    if (!arquivo) return e.badRequestError('Edital sem arquivo PDF')

    var url = $files.getFileInfo(edital, 'arquivo').url || ''
    if (!url) return e.badRequestError('Não foi possível obter o arquivo do edital')

    edital.set('status', 'processando')
    $app.save(edital)

    try {
      // extrai o texto do PDF e pede para a IA estruturar as disciplinas
      var md = $documents.toMarkdown($files.getFileByUrl(url))
      var prompt =
        'Extraia de um EDITAL de concurso a lista de DISCIPLINAS/MATÉRIAS cobradas, com os principais assuntos de cada uma. ' +
        'Não invente conteúdos que não estão no edital; se um campo não estiver claro, omita.\n' +
        'Texto do edital (trecho):\n"""\n' +
        String(md).slice(0, 40000) +
        '\n"""\n\n' +
        'Responda APENAS com JSON válido, sem markdown e sem crases, em uma linha:\n' +
        '{"cargo":"...","escolaridade":"...","disciplinas":[{"nome":"...","assuntos":["...","..."]}]}'

      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é um analista de editais de concursos. Responde em português do Brasil, apenas com o JSON pedido, sem markdown e sem crases.',
          },
          { role: 'user', content: prompt },
        ],
      })
      var text = String(reply.choices[0].message.content || '')
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
      var start = text.indexOf('{')
      var end = text.lastIndexOf('}')
      if (start < 0 || end <= start) throw new Error('IA não retornou JSON')

      var extraido = JSON.parse(text.substring(start, end + 1))
      if (!extraido || !Array.isArray(extraido.disciplinas))
        throw new Error('JSON da IA sem disciplinas')

      edital.set('status', 'processado')
      edital.set('disciplinas_json', JSON.stringify(extraido))
      edital.set('erro_msg', '')
      $app.save(edital)
      return e.json(200, { data: extraido })
    } catch (err) {
      if (err instanceof SkipAiConfigError) {
        edital.set('status', 'erro')
        edital.set('erro_msg', 'IA temporariamente indisponível')
        $app.save(edital)
        return e.json(503, {
          error:
            'IA temporariamente indisponível. O arquivo foi salvo e pode ser processado depois.',
        })
      }
      if (err instanceof SkipAiError) {
        edital.set('status', 'erro')
        edital.set('erro_msg', 'Falha na chamada de IA')
        $app.save(edital)
        return e.json(502, { error: 'Falha na chamada de IA' })
      }
      edital.set('status', 'erro')
      edital.set(
        'erro_msg',
        String(err.message || err || 'Erro ao processar o edital').slice(0, 499),
      )
      $app.save(edital)
      return e.json(500, {
        error: 'Não foi possível processar o edital: ' + String(err.message || err),
      })
    }
  },
  $apis.requireAuth(),
)
