migrate(
  (app) => {
    const usersId = '_pb_users_auth_'

    const mindMaps = new Collection({
      name: 'mind_maps',
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
          collectionId: usersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true, min: 1, max: 200 },
        { name: 'assunto', type: 'text', max: 300 },
        {
          name: 'materia_id',
          type: 'relation',
          required: false,
          collectionId: app.findCollectionByNameOrId('materias').id,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'nivel_detalhe',
          type: 'select',
          required: false,
          values: ['resumido', 'intermediario', 'aprofundado'],
          maxSelect: 1,
        },
        {
          name: 'nivel_conhecimento',
          type: 'select',
          required: false,
          values: ['basico', 'intermediario', 'avancado'],
          maxSelect: 1,
        },
        {
          name: 'foco',
          type: 'select',
          required: false,
          values: ['enem', 'vestibular'],
          maxSelect: 1,
        },
        { name: 'data_json', type: 'json', required: false, maxSize: 2000000 },
        { name: 'favorito', type: 'bool' },
        {
          name: 'origem',
          type: 'select',
          required: false,
          values: ['ia', 'documento', 'manual'],
          maxSelect: 1,
        },
        { name: 'flashcards_json', type: 'json', required: false, maxSize: 1000000 },
        { name: 'questoes_json', type: 'json', required: false, maxSize: 1000000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mind_maps_usuario ON mind_maps (usuario_id)',
        'CREATE INDEX idx_mind_maps_usuario_updated ON mind_maps (usuario_id, updated DESC)',
        'CREATE INDEX idx_mind_maps_materia ON mind_maps (materia_id)',
      ],
    })
    app.save(mindMaps)

    const mindMapsId = mindMaps.id

    const mindMapNodes = new Collection({
      name: 'mind_map_nodes',
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
          collectionId: usersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'mind_map_id',
          type: 'relation',
          required: true,
          collectionId: mindMapsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'node_key', type: 'text', required: true, min: 1, max: 100 },
        { name: 'rotulo', type: 'text', max: 500 },
        { name: 'detalhe', type: 'text', max: 5000 },
        { name: 'nivel_profundidade', type: 'number', onlyInt: true, min: 0, max: 20 },
        { name: 'pos_x', type: 'number' },
        { name: 'pos_y', type: 'number' },
        { name: 'cor', type: 'text', max: 40 },
        { name: 'colapsado', type: 'bool' },
        { name: 'ordem', type: 'number', onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_mmnode_map_key ON mind_map_nodes (mind_map_id, node_key)',
        'CREATE INDEX idx_mmnode_usuario ON mind_map_nodes (usuario_id)',
      ],
    })
    app.save(mindMapNodes)
  },
  (app) => {
    try {
      const nodes = app.findCollectionByNameOrId('mind_map_nodes')
      app.delete(nodes)
    } catch (_) {}
    try {
      const maps = app.findCollectionByNameOrId('mind_maps')
      app.delete(maps)
    } catch (_) {}
  },
)
