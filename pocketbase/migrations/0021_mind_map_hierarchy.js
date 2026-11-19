migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('mind_map_nodes')
    if (!col.fields.getByName('pai_key')) {
      col.fields.add(new TextField({ name: 'pai_key', max: 100 }))
    }
    if (!col.fields.getByName('links_json')) {
      col.fields.add(new JSONField({ name: 'links_json', maxSize: 100000 }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('mind_map_nodes')
    if (col.fields.getByName('links_json')) col.fields.removeByName('links_json')
    if (col.fields.getByName('pai_key')) col.fields.removeByName('pai_key')
    app.save(col)
  },
)
