migrate(
  (app) => {
    // ---------- Coleção do perfil/onboarding de estudo (owner-only) ----------
    const col = new Collection({
      name: 'perfil_estudo',
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
          name: 'objetivo',
          type: 'select',
          values: ['enem', 'vestibular', 'faculdade_particular', 'concurso', 'multiplus'],
          maxSelect: 1,
        },
        {
          name: 'instituicoes',
          type: 'text',
          maxSize: 500,
        },
        { name: 'data_prova', type: 'date' },
        { name: 'horas_por_dia', type: 'number', onlyInt: true, min: 1, max: 16 },
        { name: 'materias_dificeis', type: 'text', maxSize: 500 },
        {
          name: 'nivel_atual',
          type: 'select',
          values: ['iniciante', 'intermediario', 'avancado'],
          maxSelect: 1,
        },
        {
          name: 'estilo_explicacao',
          type: 'select',
          values: ['resumido', 'detalhado'],
          maxSelect: 1,
        },
        {
          name: 'preferencia_estudo',
          type: 'select',
          values: ['questoes', 'leitura', 'mapas_mentais', 'revisoes'],
          maxSelect: 1,
        },
        { name: 'onboarding_concluido', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_perfil_estudo_usuario ON perfil_estudo (usuario_id)'],
    })
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('perfil_estudo')
      app.delete(col)
    } catch (_) {}
  },
)
