// Endpoints de IA da aba Mapas Mentais.
// Todas as chamadas passam pelo gateway de IA nativo do Skip Cloud ($ai.chat),
// autenticadas pelo token do próprio usuário — nenhuma chave no front.
routerAdd(
  'POST',
  '/backend/v1/mapas-ia',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')

    var body = e.requestInfo().body || {}
    var acao = body.acao || ''
    var contexto = body.contexto || ''
    var tema = body.tema || ''
    var materia = body.materia || ''
    var nivelDetalhe = body.nivel_detalhe || 'intermediario'
    var nivelConhecimento = body.nivel_conhecimento || 'intermediario'
    var foco = body.foco || 'enem'
    var conteudoExtra = body.conteudo_extra || ''
    var textoDocumento = body.texto_documento || ''

    if (acao === 'gerar') {
      if (!tema || !tema.trim()) return e.badRequestError('Informe o assunto do mapa mental')

      var promptGerar =
        'Você é um especialista em conteúdo do ENEM e vestibulares brasileiros, didata de mapas mentais.\n' +
        'Crie um MAPA MENTAL hierárquico sobre: "' +
        tema +
        '"' +
        (materia ? '\nMatéria: ' + materia : '') +
        '\nDetalhamento: ' +
        nivelDetalhe +
        ' (resumido=3 ramos, 2 níveis; intermediario=4 a 5 ramos, 3 níveis; aprofundado=6+ ramos, 4 níveis)' +
        '\nNível do aluno: ' +
        nivelConhecimento +
        '\nFoco: ' +
        (foco === 'enem'
          ? 'ENEM — priorize conteúdos e recortes que realmente caem no ENEM'
          : 'vestibulares de Medicina — aprofunde como FUVEST/Unicamp/Unesp') +
        '\nAluno com TDAH: frases curtas, palavras-chave fortes, nada de parágrafos longos.' +
        (conteudoExtra ? '\n\nConteúdo base fornecido pelo aluno:\n' + conteudoExtra : '') +
        (textoDocumento
          ? '\n\nConteúdo extraído do documento enviado pelo aluno (pode estar truncado):\n' +
            textoDocumento
          : '') +
        '\n\nResponda APENAS com JSON válido, sem markdown, sem crases:\n' +
        '{"titulo":"...","assunto":"...","nos":[{"chave":"raiz","rotulo":"tema central","detalhe":"definição em 1 frase","nivel":0,"pai":""},{"chave":"r1","rotulo":"ramo 1","detalhe":"...","nivel":1,"pai":"raiz","cor":"violeta"},{"chave":"r1a","rotulo":"subtópico","detalhe":"...","nivel":2,"pai":"r1"}]}\n' +
        'Regras:\n' +
        '- chave: id único curto (raiz, r1, r1a, r1b, r2, r2a...); pai: chave do nó de cima (vazio só na raiz)\n' +
        '- nivel: 0 na raiz, 1 nos ramos, 2+ nos subtópicos\n' +
        '- rotulo: no máximo 5 palavras; detalhe: definição, fórmula ou exemplo em 1 frase curta\n' +
        '- inclua conceitos importantes, definições, exemplos, fórmulas quando existirem e palavras-chave\n' +
        '- cores permitidas para ramos (nivel 1): violeta, azul, esmeralda, âmbar, rosa, ciano, laranja, vermelho\n' +
        '- JSON inteiro em uma linha, sem quebras de linha dentro das strings'
    } else if (
      acao === 'expandir' ||
      acao === 'resumir' ||
      acao === 'explicar' ||
      acao === 'exemplos'
    ) {
      var topico = body.topico || ''
      if (!topico || !topico.trim()) return e.badRequestError('Selecione um tópico do mapa')

      var instrucao = ''
      if (acao === 'expandir')
        instrucao =
          'Desenvolva este tópico em 3 a 5 subtópicos filhos, cada um com rótulo curto e detalhe de 1 frase.'
      else if (acao === 'resumir')
        instrucao =
          'Resuma este tópico: reescreva o rótulo (máx 4 palavras) e o detalhe (1 frase curta), e sugira no máximo 2 filhos essenciais.'
      else if (acao === 'explicar')
        instrucao =
          'Explique o conceito de forma didática, passo a passo, em no máximo 120 palavras, como se explicasse a um aluno com TDAH.'
      else
        instrucao =
          'Crie 3 exemplos concretos e comentados deste tópico, no estilo ENEM (situação-problema quando fizer sentido).'

      var promptTopico =
        'Você é um especialista em ENEM e vestibulares. Conteúdo do mapa mental atual:\n' +
        contexto +
        '\n\nTópico selecionado: "' +
        topico +
        '"\n' +
        instrucao +
        (foco === 'enem' ? ' Priorize o que cai no ENEM.' : ' Priorize o estilo de vestibular.') +
        (conteudoExtra ? '\n\nConteúdo base fornecido pelo aluno:\n' + conteudoExtra : '') +
        (textoDocumento
          ? '\n\nConteúdo extraído do documento enviado pelo aluno (pode estar truncado):\n' +
            textoDocumento
          : '') +
        '\n\nResponda APENAS com JSON válido, sem markdown, sem crases:\n' +
        '{"nos":[{"chave":"novo1","rotulo":"...","detalhe":"...","nivel":2,"pai":"<chave do pai>","cor":"..."}],"explicacao":"texto da explicação quando pedida, senão vazio"}\n' +
        '- chave: id único curto que não repita nenhuma chave já existente no contexto\n' +
        '- "pai" deve ser a chave do tópico selecionado (ou de um nó novo criado agora)\n' +
        '- cores permitidas: violeta, azul, esmeralda, âmbar, rosa, ciano, laranja, vermelho\n' +
        '- JSON inteiro em uma linha'
    } else if (acao === 'questoes' || acao === 'flashcards') {
      var alvoTexto =
        topico && topico.trim()
          ? 'tópico "' + topico + '" e seus filhos'
          : tema
            ? 'tema central "' + tema + '"'
            : 'mapa completo abaixo'
      var promptEstudo =
        'Você é um elaborador de itens do ENEM. Mapa mental do aluno:\n' +
        contexto +
        '\n\nAlvo: ' +
        alvoTexto +
        (acao === 'questoes'
          ? '\nCrie 5 questões objetivas no estilo ENEM (contexto + comando), com 4 alternativas, gabarito e explicação curta.'
          : '\nCrie 8 flashcards de pergunta e resposta curta sobre os pontos mais cobrados.') +
        (conteudoExtra ? '\n\nConteúdo base fornecido pelo aluno:\n' + conteudoExtra : '') +
        (textoDocumento
          ? '\n\nConteúdo extraído do documento enviado pelo aluno (pode estar truncado):\n' +
            textoDocumento
          : '') +
        '\n\nResponda APENAS com JSON válido, sem markdown, sem crases:\n'
      if (acao === 'questoes') {
        promptEstudo +=
          '{"questoes":[{"enunciado":"...","alternativas":["A...","B...","C...","D..."],"gabarito":0,"explicacao":"..."}]}\n' +
          '- gabarito: índice da alternativa correta (0 a 3)\n- JSON inteiro em uma linha'
      } else {
        promptEstudo +=
          '{"flashcards":[{"frente":"pergunta curta","verso":"resposta curta"}]}\n' +
          '- JSON inteiro em uma linha'
      }
    } else {
      return e.badRequestError('Ação inválida')
    }

    var promptFinal =
      acao === 'gerar'
        ? promptGerar
        : acao === 'questoes' || acao === 'flashcards'
          ? promptEstudo
          : promptTopico

    try {
      var reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content:
              'Você é a Coruja Mentora, especialista em ENEM e vestibulares brasileiros. Responda sempre em português do Brasil, apenas com o JSON pedido, sem markdown e sem crases.',
          },
          { role: 'user', content: promptFinal },
        ],
      })

      var text = reply.choices[0].message.content || ''
      text = String(text)
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
      var start = text.indexOf('{')
      var end = text.lastIndexOf('}')
      if (start < 0 || end <= start) {
        return e.json(502, { error: 'A IA não retornou um mapa válido. Tente novamente.' })
      }

      var parsed
      try {
        parsed = JSON.parse(text.substring(start, end + 1))
      } catch (_) {
        return e.json(502, { error: 'Não consegui interpretar a resposta da IA. Tente novamente.' })
      }

      return e.json(200, { data: parsed, truncated: false })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponível' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha na chamada de IA' })
      throw err
    }
  },
  $apis.requireAuth(),
)
