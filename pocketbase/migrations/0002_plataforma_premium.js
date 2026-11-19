/// <reference types="pocketbase" />
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // helper: cria coleção de dados pessoais (dono vê só o dele, responsável lê)
    const dataRules = {
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.usuario_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
    }

    const fieldsBase = [
      {
        name: 'usuario_id',
        type: 'relation',
        required: true,
        collectionId: usersCol.id,
        maxSelect: 1,
      },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]

    // ids das coleções existentes (migração 0001) — relations exigem collectionId real
    const materiasId = app.findCollectionByNameOrId('materias').id
    const topicosId = app.findCollectionByNameOrId('topicos').id
    const missoesId = app.findCollectionByNameOrId('missoes').id

    // 1. user_preferences
    const userPreferences = new Collection({
      name: 'user_preferences',
      type: 'base',
      ...dataRules,
      fields: [
        ...fieldsBase,
        { name: 'meta_diaria_min', type: 'number' },
        { name: 'meta_semanal_min', type: 'number' },
        { name: 'tema', type: 'select', values: ['dark', 'light'], maxSelect: 1 },
        { name: 'notificacoes_email', type: 'bool' },
      ],
      indexes: [],
    })
    app.save(userPreferences)

    // 2. study_sessions — registro de sessões de estudo (tempo real)
    const studySessions = new Collection({
      name: 'study_sessions',
      type: 'base',
      ...dataRules,
      fields: [
        ...fieldsBase,
        { name: 'data', type: 'date', required: true },
        { name: 'minutos', type: 'number', required: true },
        {
          name: 'tipo',
          type: 'select',
          values: ['teoria', 'pratica', 'revisao', 'livre'],
          maxSelect: 1,
        },
        { name: 'materia_id', type: 'relation', collectionId: materiasId, maxSelect: 1 },
        { name: 'missao_id', type: 'relation', collectionId: missoesId, maxSelect: 1 },
      ],
      indexes: [],
    })
    app.save(studySessions)

    // 3. study_plans — plano macro (usa exam_date do config_alertas)
    const studyPlans = new Collection({
      name: 'study_plans',
      type: 'base',
      ...dataRules,
      fields: [
        ...fieldsBase,
        { name: 'nome', type: 'text', required: true },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'ativo', type: 'bool' },
      ],
      indexes: [],
    })
    app.save(studyPlans)

    // 4. study_tasks — tarefas do plano (cronograma existente alimenta missoes)
    const studyTasks = new Collection({
      name: 'study_tasks',
      type: 'base',
      ...dataRules,
      fields: [
        ...fieldsBase,
        { name: 'study_plan_id', type: 'relation', collectionId: studyPlans.id, maxSelect: 1 },
        { name: 'materia_id', type: 'relation', collectionId: materiasId, maxSelect: 1 },
        { name: 'topico_id', type: 'relation', collectionId: topicosId, maxSelect: 1 },
        { name: 'titulo', type: 'text', required: true },
        { name: 'data', type: 'date' },
        { name: 'minutos_previstos', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'em_andamento', 'concluida'],
          maxSelect: 1,
        },
      ],
      indexes: ['CREATE INDEX idx_study_tasks_data ON study_tasks (data)'],
    })
    app.save(studyTasks)

    // 5a. mpc_contents — conteúdo específico do MPC (nível folha, compartilhado)
    const mpcContents = new Collection({
      name: 'mpc_contents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        {
          name: 'topico_id',
          type: 'relation',
          required: true,
          collectionId: topicosId,
          maxSelect: 1,
        },
        {
          name: 'materia_id',
          type: 'relation',
          required: true,
          collectionId: materiasId,
          maxSelect: 1,
        },
        { name: 'subassunto', type: 'text' },
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'dificuldade', type: 'number' },
        { name: 'importancia_enem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mpc_contents_topico ON mpc_contents (topico_id)',
        'CREATE INDEX idx_mpc_contents_materia ON mpc_contents (materia_id)',
      ],
    })
    app.save(mpcContents)
    const mpcContentsId = app.findCollectionByNameOrId('mpc_contents').id

    // 5. content_progress — progresso por conteúdo (MPC)
    const contentProgress = new Collection({
      name: 'content_progress',
      type: 'base',
      ...dataRules,
      fields: [
        ...fieldsBase,
        {
          name: 'conteudo_id',
          type: 'relation',
          required: true,
          collectionId: mpcContentsId,
          maxSelect: 1,
        },
        { name: 'materia_id', type: 'relation', collectionId: materiasId, maxSelect: 1 },
        { name: 'topico_id', type: 'relation', collectionId: topicosId, maxSelect: 1 },
        {
          name: 'status',
          type: 'select',
          values: [
            'nao_iniciado',
            'planejado',
            'em_andamento',
            'estudado',
            'em_revisao',
            'dominado',
          ],
          maxSelect: 1,
        },
        { name: 'nivel_dominio', type: 'number' },
        { name: 'observacoes', type: 'text' },
        { name: 'dificuldades', type: 'text' },
        { name: 'prioridade', type: 'number' },
        { name: 'questoes_realizadas', type: 'number' },
        { name: 'questoes_acertadas', type: 'number' },
        { name: 'ultima_data_estudo', type: 'date' },
        { name: 'proxima_revisao', type: 'date' },
      ],
      indexes: [],
    })
    app.save(contentProgress)

    // 7. notifications — central de notificações in-app
    const notifications = new Collection({
      name: 'notifications',
      type: 'base',
      ...dataRules,
      fields: [
        ...fieldsBase,
        { name: 'titulo', type: 'text', required: true },
        { name: 'mensagem', type: 'text' },
        {
          name: 'tipo',
          type: 'select',
          values: ['info', 'lembrete', 'conquista', 'alerta', 'revisao'],
          maxSelect: 1,
        },
        { name: 'lida', type: 'bool' },
        { name: 'link', type: 'text' },
      ],
      indexes: [],
    })
    app.save(notifications)

    // 8. achievements
    const achievements = new Collection({
      name: 'achievements',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'codigo', type: 'text', required: true },
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'icone', type: 'text' },
        { name: 'xp_recompensa', type: 'number' },
        {
          name: 'condicao',
          type: 'select',
          values: [
            'streak_dias',
            'questoes_resolvidas',
            'missoes_concluidas',
            'tempo_estudado',
            'acertos',
          ],
          maxSelect: 1,
        },
        { name: 'limiar', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_achievements_codigo ON achievements (codigo)'],
    })
    app.save(achievements)

    // 9. user_achievements
    const userAchievements = new Collection({
      name: 'user_achievements',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        ...fieldsBase,
        {
          name: 'achievement_id',
          type: 'relation',
          required: true,
          collectionId: achievements.id,
          maxSelect: 1,
        },
      ],
      indexes: [],
    })
    app.save(userAchievements)

    // 10. xp_transactions
    const xpTransactions = new Collection({
      name: 'xp_transactions',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        ...fieldsBase,
        { name: 'quantidade', type: 'number', required: true },
        { name: 'motivo', type: 'text', required: true },
        {
          name: 'origem',
          type: 'select',
          values: ['missao', 'questao', 'revisao', 'conquista', 'bonus'],
          maxSelect: 1,
        },
        { name: 'referencia_id', type: 'text' },
      ],
      indexes: [],
    })
    app.save(xpTransactions)

    // 11. achievements seed (catálogo global)
    const achCol = app.findCollectionByNameOrId('achievements')
    const seed = [
      {
        codigo: 'primeira_missao',
        nome: 'Primeira Missão',
        descricao: 'Concluiu a primeira missão de sprint',
        icone: 'Rocket',
        condicao: 'missoes_concluidas',
        limiar: 1,
        xp: 50,
      },
      {
        codigo: 'dez_missoes',
        nome: 'Constância',
        descricao: 'Concluiu 10 missões de sprint',
        icone: 'Target',
        condicao: 'missoes_concluidas',
        limiar: 10,
        xp: 150,
      },
      {
        codigo: 'cinquenta_questoes',
        nome: 'Maratonista',
        descricao: 'Resolveu 50 questões',
        icone: 'Brain',
        condicao: 'questoes_resolvidas',
        limiar: 50,
        xp: 100,
      },
      {
        codigo: 'cem_questoes',
        nome: 'Veterano',
        descricao: 'Resolveu 100 questões',
        icone: 'Medal',
        condicao: 'questoes_resolvidas',
        limiar: 100,
        xp: 200,
      },
      {
        codigo: 'streak_3',
        nome: 'Aquecendo',
        descricao: '3 dias consecutivos de estudo',
        icone: 'Flame',
        condicao: 'streak_dias',
        limiar: 3,
        xp: 75,
      },
      {
        codigo: 'streak_7',
        nome: 'Imparável',
        descricao: '7 dias consecutivos de estudo',
        icone: 'Flame',
        condicao: 'streak_dias',
        limiar: 7,
        xp: 250,
      },
    ]
    for (const a of seed) {
      try {
        app.findFirstRecordByData('achievements', 'codigo', a.codigo)
      } catch (_) {
        const rec = new Record(achCol)
        rec.set('codigo', a.codigo)
        rec.set('nome', a.nome)
        rec.set('descricao', a.descricao)
        rec.set('icone', a.icone)
        rec.set('condicao', a.condicao)
        rec.set('limiar', a.limiar)
        rec.set('xp_recompensa', a.xp)
        app.save(rec)
      }
    }
  },
  (app) => {
    ;[
      'xp_transactions',
      'user_achievements',
      'achievements',
      'notifications',
      'mpc_contents',
      'content_progress',
      'study_tasks',
      'study_plans',
      'study_sessions',
      'user_preferences',
    ].forEach((name) => {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    })
  },
)
