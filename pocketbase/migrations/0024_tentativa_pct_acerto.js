/// <reference path="../types.d.ts" />
// 0024: adiciona pct_acerto à tentativa para alimentar histórico/evolução/média na home.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('simulado_tentativas')
    if (!col.fields.getByName('pct_acerto')) {
      col.fields.add(new NumberField({ name: 'pct_acerto', onlyInt: false, min: 0, max: 100 }))
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('simulado_tentativas')
      if (col.fields.getByName('pct_acerto')) {
        col.fields.removeByName('pct_acerto')
        app.save(col)
      }
    } catch (_) {}
  },
)
