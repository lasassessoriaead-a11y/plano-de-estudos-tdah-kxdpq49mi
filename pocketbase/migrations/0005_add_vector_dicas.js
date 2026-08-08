migrate(
  (app) => {
    try {
      var existing = app.findCollectionByNameOrId('dicas')
      app.delete(existing)
    } catch (_) {}

    var materiasId = app.findCollectionByNameOrId('materias').id
    var topicosId = app.findCollectionByNameOrId('topicos').id

    var dicas = new Collection({
      name: 'dicas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'materia_id', type: 'relation', collectionId: materiasId, maxSelect: 1 },
        { name: 'topico_id', type: 'relation', collectionId: topicosId, maxSelect: 1 },
        {
          name: 'vestibular',
          type: 'select',
          values: ['enem', 'vunesp', 'unicamp', 'geral'],
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'conteudo', type: 'editor' },
        { name: 'mes', type: 'text' },
        { name: 'embedding', type: 'vector', dimensions: 1536, distance: 'cosine' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_dicas_vestibular ON dicas (vestibular)',
        'CREATE INDEX idx_dicas_materia ON dicas (materia_id)',
      ],
    })
    app.save(dicas)
  },
  (app) => {
    try {
      var existing = app.findCollectionByNameOrId('dicas')
      app.delete(existing)
    } catch (_) {}

    var materiasId = app.findCollectionByNameOrId('materias').id
    var topicosId = app.findCollectionByNameOrId('topicos').id

    var dicas = new Collection({
      name: 'dicas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'materia_id', type: 'relation', collectionId: materiasId, maxSelect: 1 },
        { name: 'topico_id', type: 'relation', collectionId: topicosId, maxSelect: 1 },
        {
          name: 'vestibular',
          type: 'select',
          values: ['enem', 'vunesp', 'unicamp', 'geral'],
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'conteudo', type: 'editor' },
        { name: 'mes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_dicas_vestibular ON dicas (vestibular)',
        'CREATE INDEX idx_dicas_materia ON dicas (materia_id)',
      ],
    })
    app.save(dicas)
  },
)
