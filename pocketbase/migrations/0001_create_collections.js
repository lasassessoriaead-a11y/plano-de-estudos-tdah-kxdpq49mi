migrate(
  (app) => {
    // 1. materias
    const materias = new Collection({
      name: 'materias',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'icone', type: 'text' },
        { name: 'cor', type: 'text' },
        { name: 'peso', type: 'number' },
        { name: 'ordem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_materias_ordem ON materias (ordem)'],
    })
    app.save(materias)

    const materiasId = materias.id

    // 2. topicos
    const topicos = new Collection({
      name: 'topicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'materia_id',
          type: 'relation',
          required: true,
          collectionId: materiasId,
          maxSelect: 1,
        },
        { name: 'prioridade', type: 'number' },
        {
          name: 'tipo',
          type: 'select',
          values: ['fluxograma', 'pratica', 'esqueleto'],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_topicos_materia ON topicos (materia_id)',
        'CREATE INDEX idx_topicos_prioridade ON topicos (prioridade)',
      ],
    })
    app.save(topicos)

    const topicosId = topicos.id

    // 3. pildes
    const pildes = new Collection({
      name: 'pildes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'topico_id',
          type: 'relation',
          required: true,
          collectionId: topicosId,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'conteudo_teorico', type: 'editor' },
        {
          name: 'formato',
          type: 'select',
          values: ['esquema', 'mapa_mental', 'fluxograma', 'topicos_diretos', 'esqueleto_redacao'],
          maxSelect: 1,
        },
        { name: 'duracao_teorica', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_pildes_topico ON pildes (topico_id)'],
    })
    app.save(pildes)

    const pildesId = pildes.id

    // 4. questoes
    const questoes = new Collection({
      name: 'questoes',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.usuario_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: null,
      fields: [
        { name: 'enunciado', type: 'text', required: true },
        { name: 'alternativas', type: 'json' },
        { name: 'gabarito', type: 'number' },
        { name: 'explicacao', type: 'text' },
        {
          name: 'materia_id',
          type: 'relation',
          required: true,
          collectionId: materiasId,
          maxSelect: 1,
        },
        { name: 'pildes_id', type: 'relation', collectionId: pildesId, maxSelect: 1 },
        { name: 'status', type: 'select', values: ['pendente', 'acertou', 'errou'], maxSelect: 1 },
        { name: 'revisao_agendada', type: 'date' },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_questoes_user ON questoes (usuario_id)',
        'CREATE INDEX idx_questoes_status ON questoes (status)',
        'CREATE INDEX idx_questoes_revisao ON questoes (revisao_agendada)',
      ],
    })
    app.save(questoes)

    // 5. missoes
    const missoes = new Collection({
      name: 'missoes',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.usuario_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'pildes_id',
          type: 'relation',
          required: true,
          collectionId: pildesId,
          maxSelect: 1,
        },
        { name: 'ordem', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'em_andamento', 'concluida'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_missoes_user_data ON missoes (usuario_id, data)',
        'CREATE INDEX idx_missoes_status ON missoes (status)',
      ],
    })
    app.save(missoes)

    const missoesId = missoes.id

    // 6. progresso
    const progresso = new Collection({
      name: 'progresso',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.usuario_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'missao_id',
          type: 'relation',
          required: true,
          collectionId: missoesId,
          maxSelect: 1,
        },
        { name: 'etapa', type: 'select', values: ['teoria', 'pratica', 'pausa'], maxSelect: 1 },
        { name: 'concluido', type: 'bool' },
        { name: 'data', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_progresso_user ON progresso (usuario_id)',
        'CREATE INDEX idx_progresso_missao ON progresso (missao_id)',
      ],
    })
    app.save(progresso)
  },
  (app) => {
    ;['progresso', 'missoes', 'questoes', 'pildes', 'topicos', 'materias'].forEach((name) => {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    })
  },
)
