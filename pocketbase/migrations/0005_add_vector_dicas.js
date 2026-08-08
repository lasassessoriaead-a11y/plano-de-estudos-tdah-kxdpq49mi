migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('dicas')
    if (!col.fields.getByName('embedding')) {
      col.fields.add(new VectorField({ name: 'embedding', dimensions: 1536, distance: 'cosine' }))
      app.save(col)
    }
  },
  (app) => {
    var col = app.findCollectionByNameOrId('dicas')
    var field = col.fields.getByName('embedding')
    if (field) {
      col.fields.remove(field)
      app.save(col)
    }
  },
)
