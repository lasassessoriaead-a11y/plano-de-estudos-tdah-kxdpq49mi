migrate(
  (app) => {
    const configAlertas = new Collection({
      name: 'config_alertas',
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
        { name: 'whatsapp_responsavel', type: 'text' },
        { name: 'whatsapp_aluno', type: 'text' },
        { name: 'horario_lembrete', type: 'text' },
        { name: 'horario_verificacao', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_config_alertas_usuario ON config_alertas (usuario_id)'],
    })
    app.save(configAlertas)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('config_alertas')
      app.delete(col)
    } catch (_) {}
  },
)
