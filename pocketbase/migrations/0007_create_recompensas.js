migrate(
  (app) => {
    const missoesId = app.findCollectionByNameOrId('missoes').id

    const recompensas = new Collection({
      name: 'recompensas',
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
        { name: 'titulo', type: 'text', required: true },
        { name: 'tipo', type: 'select', values: ['dinheiro', 'outro'], maxSelect: 1 },
        { name: 'valor', type: 'number' },
        { name: 'status', type: 'select', values: ['disponivel', 'resgatada'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_recompensas_usuario ON recompensas (usuario_id)',
        'CREATE INDEX idx_recompensas_missao ON recompensas (missao_id)',
        'CREATE INDEX idx_recompensas_status ON recompensas (status)',
      ],
    })
    app.save(recompensas)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('recompensas')
      app.delete(col)
    } catch (_) {}
  },
)
