migrate(
  (app) => {
    var userId = ''
    try {
      userId = app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com').id
    } catch (_) {}
    if (!userId) return

    try {
      var missoes = app.findRecordsByFilter('missoes', 'usuario_id = {:uid}', '', 0, 0, {
        uid: userId,
      })
      for (var i = 0; i < missoes.length; i++) {
        app.delete(missoes[i])
      }
    } catch (_) {}

    try {
      var progressos = app.findRecordsByFilter('progresso', 'usuario_id = {:uid}', '', 0, 0, {
        uid: userId,
      })
      for (var j = 0; j < progressos.length; j++) {
        app.delete(progressos[j])
      }
    } catch (_) {}

    try {
      var questoes = app.findRecordsByFilter('questoes', 'usuario_id = {:uid}', '', 0, 0, {
        uid: userId,
      })
      for (var k = 0; k < questoes.length; k++) {
        questoes[k].set('status', 'pendente')
        questoes[k].set('revisao_agendada', null)
        app.save(questoes[k])
      }
    } catch (_) {}

    try {
      var recompensas = app.findRecordsByFilter('recompensas', 'usuario_id = {:uid}', '', 0, 0, {
        uid: userId,
      })
      for (var l = 0; l < recompensas.length; l++) {
        app.delete(recompensas[l])
      }
    } catch (_) {}

    try {
      var notifs = app.findRecordsByFilter('notificacoes', 'usuario_id = {:uid}', '', 0, 0, {
        uid: userId,
      })
      for (var m = 0; m < notifs.length; m++) {
        app.delete(notifs[m])
      }
    } catch (_) {}
  },
  (app) => {},
)
