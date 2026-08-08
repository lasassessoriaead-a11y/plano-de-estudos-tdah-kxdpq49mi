migrate(
  (app) => {
    const notificacoes = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && @request.body.usuario_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: null,
      fields: [
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['lembrete_estudo', 'tarefa_nao_cumprida'],
          maxSelect: 1,
        },
        { name: 'destino', type: 'text' },
        { name: 'conteudo', type: 'text' },
        { name: 'data', type: 'date' },
        { name: 'status', type: 'select', values: ['pendente', 'enviada'], maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notificacoes_usuario ON notificacoes (usuario_id)',
        'CREATE INDEX idx_notificacoes_tipo ON notificacoes (tipo)',
        'CREATE INDEX idx_notificacoes_status ON notificacoes (status)',
      ],
    })
    app.save(notificacoes)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('notificacoes')
      app.delete(col)
    } catch (_) {}
  },
)
