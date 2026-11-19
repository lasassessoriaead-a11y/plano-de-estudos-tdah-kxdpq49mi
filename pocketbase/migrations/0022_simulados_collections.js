migrate(
  (app) => {
    // ---------- Coleção de questões do banco de simulados (pública p/ leitura, owner-only na escrita) ----------
    const sq = new Collection({
      name: 'sim_questoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'enunciado', type: 'text', required: true, maxSize: 8000 },
        { name: 'alternativas', type: 'json', required: true, maxSize: 60000 },
        { name: 'gabarito', type: 'number', required: false, onlyInt: true, min: 0, max: 4 },
        { name: 'resolucao', type: 'editor', maxSize: 200000 },
        {
          name: 'area',
          type: 'select',
          required: true,
          values: ['linguagens', 'humanas', 'natureza', 'matematica', 'redacao'],
          maxSelect: 1,
        },
        { name: 'assunto', type: 'text', maxSize: 300 },
        {
          name: 'dificuldade',
          type: 'select',
          values: ['facil', 'medio', 'dificil'],
          maxSelect: 1,
        },
        { name: 'ano', type: 'number', onlyInt: true },
        { name: 'instituicao', type: 'text', maxSize: 120 },
        { name: 'origem', type: 'text', maxSize: 120 },
        { name: 'identificador', type: 'text', maxSize: 120 },
        { name: 'a', type: 'number' },
        { name: 'b', type: 'number' },
        { name: 'c', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_sim_questoes_area ON sim_questoes (area)',
        'CREATE INDEX idx_sim_questoes_usuario ON sim_questoes (usuario_id)',
      ],
    })
    app.save(sq)

    // ---------- Coleção de simulados (definição/prova montada) ----------
    const st = new Collection({
      name: 'simulados',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true, maxSize: 200 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['enem_dia1', 'enem_dia2', 'area', 'personalizado'],
          maxSelect: 1,
        },
        { name: 'config_json', type: 'json', required: true, maxSize: 20000 },
        { name: 'questoes_ids', type: 'json', required: true, maxSize: 200000 },
        { name: 'duracao_min', type: 'number', required: true, onlyInt: true, min: 5, max: 600 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_simulados_usuario ON simulados (usuario_id)',
        'CREATE INDEX idx_simulados_usuario_created ON simulados (usuario_id, created DESC)',
      ],
    })
    app.save(st)

    // ---------- Coleção de tentativas (execução do simulado) ----------
    const te = new Collection({
      name: 'simulado_tentativas',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'simulado_id',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('simulados').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['em_andamento', 'finalizada', 'abandonada'],
          maxSelect: 1,
        },
        { name: 'respostas_json', type: 'json', required: true, maxSize: 200000 },
        { name: 'marcadas_json', type: 'json', maxSize: 100000 },
        { name: 'tempo_usado_seg', type: 'number', onlyInt: true, min: 0 },
        { name: 'iniciado_em', type: 'date' },
        { name: 'finalizado_em', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_simtent_usuario ON simulado_tentativas (usuario_id)',
        'CREATE INDEX idx_simtent_simulado ON simulado_tentativas (simulado_id)',
        'CREATE INDEX idx_simtent_usuario_created ON simulado_tentativas (usuario_id, created DESC)',
      ],
    })
    app.save(te)
  },
  (app) => {
    for (const nome of ['simulado_tentativas', 'simulados', 'sim_questoes']) {
      try {
        const col = app.findCollectionByNameOrId(nome)
        app.delete(col)
      } catch (_) {}
    }
  },
)
