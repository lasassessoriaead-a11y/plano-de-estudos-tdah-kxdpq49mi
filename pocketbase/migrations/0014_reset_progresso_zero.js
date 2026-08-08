migrate(
  (app) => {
    // 1. Delete ALL progresso records
    if (app.hasTable('progresso')) {
      const progressoCol = app.findCollectionByNameOrId('progresso')
      app.truncateCollection(progressoCol)
    }

    // 2. Reset ALL missoes to status = "pendente"
    if (app.hasTable('missoes')) {
      const missoes = app.findRecordsByFilter('missoes', 'id != ""', '', 0, 0)
      const missoesCol = app.findCollectionByNameOrId('missoes')
      for (var i = 0; i < missoes.length; i++) {
        var rec = missoes[i]
        rec.set('status', 'pendente')
        app.save(rec)
      }
    }

    // 3. Reset ALL questoes to status = "pendente" and clear revisao_agendada
    if (app.hasTable('questoes')) {
      var questoes = app.findRecordsByFilter('questoes', 'id != ""', '', 0, 0)
      for (var j = 0; j < questoes.length; j++) {
        var q = questoes[j]
        q.set('status', 'pendente')
        q.set('revisao_agendada', null)
        app.save(q)
      }
    }

    // 4. Delete ALL recompensas records
    if (app.hasTable('recompensas')) {
      const recompensasCol = app.findCollectionByNameOrId('recompensas')
      app.truncateCollection(recompensasCol)
    }

    // 5. Delete ALL notificacoes records
    if (app.hasTable('notificacoes')) {
      const notificacoesCol = app.findCollectionByNameOrId('notificacoes')
      app.truncateCollection(notificacoesCol)
    }
  },
  (app) => {
    // No-op: this is a data reset migration — reverting is not applicable
  },
)
