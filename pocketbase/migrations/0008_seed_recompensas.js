migrate(
  (app) => {
    let userId
    try {
      userId = app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com').id
    } catch (_) {
      return
    }

    const recompensasCol = app.findCollectionByNameOrId('recompensas')

    var seeds = [
      {
        titulo: 'R$ 10 para um acai gostoso',
        tipo: 'dinheiro',
        valor: 10,
        missaoTitulo: 'Citologia: Membrana Plasmatica',
        status: 'disponivel',
      },
      {
        titulo: 'Assistir um filme a escolha',
        tipo: 'outro',
        valor: 0,
        missaoTitulo: 'Esqueleto de Redacao nota 900+',
        status: 'disponivel',
      },
    ]

    for (var i = 0; i < seeds.length; i++) {
      var s = seeds[i]
      try {
        app.findFirstRecordByData('recompensas', 'titulo', s.titulo)
      } catch (_) {
        var missaoId
        try {
          missaoId = app.findFirstRecordByData('missoes', 'titulo', s.missaoTitulo).id
        } catch (_) {
          continue
        }
        var rec = new Record(recompensasCol)
        rec.set('usuario_id', userId)
        rec.set('missao_id', missaoId)
        rec.set('titulo', s.titulo)
        rec.set('tipo', s.tipo)
        rec.set('valor', s.valor)
        rec.set('status', s.status)
        app.save(rec)
      }
    }
  },
  (app) => {},
)
