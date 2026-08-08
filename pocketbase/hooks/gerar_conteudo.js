routerAdd(
  'POST',
  '/backend/v1/gerar-conteudo',
  (e) => {
    try {
      var body = e.requestInfo().body || {}
      var limit = body.limit || 2
      if (limit > 5) limit = 5
      var topicoId = body.topico_id || ''

      var allPildes = []
      if (topicoId) {
        try {
          allPildes = $app.findRecordsByFilter('pildes', 'topico_id = {:tid}', '', 5, 0, {
            tid: topicoId,
          })
        } catch (_) {}
      } else {
        try {
          allPildes = $app.findRecordsByFilter('pildes', '1=1', 'created', 200, 0)
        } catch (_) {}
      }

      var toGenerate = []
      for (var i = 0; i < allPildes.length; i++) {
        var content = allPildes[i].getString('conteudo_teorico')
        if (
          !content ||
          content.trim() === '' ||
          content.trim() === '<p></p>' ||
          content.trim() === '<p><br></p>'
        ) {
          toGenerate.push(allPildes[i])
        }
        if (toGenerate.length >= limit) break
      }

      if (toGenerate.length === 0) {
        return e.json(200, {
          processed: 0,
          succeeded: 0,
          failed: 0,
          message: 'Nenhum conteúdo pendente.',
        })
      }

      var alunoId = ''
      try {
        var alunos = $app.findRecordsByFilter('users', 'role = {:r}', '', 1, 0, { r: 'aluno' })
        if (alunos.length > 0) alunoId = alunos[0].id
      } catch (_) {}
      if (!alunoId) {
        try {
          alunoId = $app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com').id
        } catch (_) {}
      }
      if (!alunoId) return e.json(400, { error: 'Usuário aluno não encontrado' })

      var qCol = $app.findCollectionByNameOrId('questoes')
      var succeeded = 0
      var failed = 0

      for (var j = 0; j < toGenerate.length; j++) {
        var pilde = toGenerate[j]
        try {
          var topico = $app.findRecordById('topicos', pilde.get('topico_id'))
          var materia = $app.findRecordById('materias', topico.get('materia_id'))
          var titulo = topico.get('titulo')
          var materiaNome = materia.get('nome')
          var descricao = topico.get('descricao') || ''
          var formato = pilde.get('formato') || 'fluxograma'

          var prompt =
            'Você é um especialista em vestibular de Medicina criando conteúdo para alunos com TDAH.\n\n' +
            'Tópico: ' +
            titulo +
            '\nMatéria: ' +
            materiaNome +
            '\nDescrição: ' +
            descricao +
            '\nFormato: ' +
            formato +
            '\n\n' +
            'Gere conteúdo teórico em HTML e 4 questões de múltipla escolha.\n\n' +
            'Regras do conteúdo:\n' +
            '- Use tags HTML: h3, h4, p, ul, li, strong\n' +
            '- Use divs de destaque: <div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"> para dicas, <div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"> para resumos\n' +
            '- SEMPRE use texto escuro: text-slate-900, text-amber-900, text-emerald-900\n' +
            '- Frases curtas e simples (máx 2 linhas cada)\n' +
            '- Máximo 400 palavras\n\n' +
            'Regras das questões:\n- 4 questões com 4 alternativas\n- Inclua explicação para cada questão\n- Nível: vestibular\n\n' +
            'Responda APENAS com JSON válido (sem markdown):\n' +
            '{"conteudo_teorico":"<h3>...</h3>","questoes":[{"enunciado":"...","alternativas":["...","...","...","..."],"gabarito":0,"explicacao":"..."}]}'

          var reply = $ai.chat({
            model: 'fast',
            messages: [
              {
                role: 'system',
                content:
                  'Você é um especialista em vestibular de Medicina. Responda sempre em português.',
              },
              { role: 'user', content: prompt },
            ],
          })

          var text = reply.choices[0].message.content
          text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '')
          var start = text.indexOf('{')
          var end = text.lastIndexOf('}')
          if (start < 0 || end <= start) {
            failed++
            continue
          }

          var parsed
          try {
            parsed = JSON.parse(text.substring(start, end + 1))
          } catch (_) {
            failed++
            continue
          }

          if (parsed.conteudo_teorico) {
            pilde.set('conteudo_teorico', parsed.conteudo_teorico)
            $app.save(pilde)
          }

          if (parsed.questoes && Array.isArray(parsed.questoes)) {
            for (var k = 0; k < parsed.questoes.length; k++) {
              var q = parsed.questoes[k]
              if (!q.enunciado || !q.alternativas) continue
              try {
                $app.findFirstRecordByData('questoes', 'enunciado', q.enunciado)
              } catch (_) {
                var rec = new Record(qCol)
                rec.set('usuario_id', alunoId)
                rec.set('enunciado', q.enunciado)
                rec.set('alternativas', q.alternativas)
                rec.set('gabarito', q.gabarito || 0)
                rec.set('explicacao', q.explicacao || '')
                rec.set('materia_id', materia.id)
                rec.set('pildes_id', pilde.id)
                rec.set('status', 'pendente')
                $app.save(rec)
              }
            }
          }
          succeeded++
        } catch (err) {
          failed++
          $app
            .logger()
            .error('content generation failed for pilde ' + pilde.id, 'error', String(err))
        }
      }

      return e.json(200, { processed: toGenerate.length, succeeded: succeeded, failed: failed })
    } catch (err) {
      if (err instanceof SkipAiConfigError)
        return e.json(503, { error: 'IA temporariamente indisponível' })
      if (err instanceof SkipAiError) return e.json(502, { error: 'Falha na geração de conteúdo' })
      throw err
    }
  },
  $apis.requireAuth(),
)
