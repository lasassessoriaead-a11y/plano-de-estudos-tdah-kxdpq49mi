migrate(
  (app) => {
    var col = app.findCollectionByNameOrId('config_alertas')
    if (!col.fields.getByName('exam_date')) {
      col.fields.add(new DateField({ name: 'exam_date' }))
    }
    app.save(col)

    var userId = ''
    try {
      var resp = app.findRecordsByFilter('users', 'role = {:r}', '', 1, 0, { r: 'responsavel' })
      if (resp.length > 0) userId = resp[0].id
    } catch (_) {}
    if (!userId) {
      try {
        var alunos = app.findRecordsByFilter('users', 'role = {:r}', '', 1, 0, { r: 'aluno' })
        if (alunos.length > 0) userId = alunos[0].id
      } catch (_) {}
    }
    if (!userId) {
      try {
        userId = app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com').id
      } catch (_) {}
    }
    if (!userId) return

    var existing = []
    try {
      existing = app.findRecordsByFilter('config_alertas', 'usuario_id = {:uid}', '', 1, 0, {
        uid: userId,
      })
    } catch (_) {}

    if (existing.length > 0) {
      existing[0].set('exam_date', '2026-11-01')
      app.save(existing[0])
    } else {
      var rec = new Record(col)
      rec.set('usuario_id', userId)
      rec.set('exam_date', '2026-11-01')
      app.save(rec)
    }
  },
  (app) => {
    try {
      var col = app.findCollectionByNameOrId('config_alertas')
      var field = col.fields.getByName('exam_date')
      if (field) col.fields.remove(field)
      app.save(col)
    } catch (_) {}
  },
)
