cronAdd('revisao_espacada', '0 6 * * *', () => {
  var alunoId = ''
  try {
    var alunos = $app.findRecordsByFilter('users', 'role = {:r}', '', 1, 0, { r: 'aluno' })
    if (alunos.length > 0) alunoId = alunos[0].id
  } catch (_) {}
  if (!alunoId) {
    try {
      alunoId = $app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com').id
    } catch (_) {}
  }
  if (!alunoId) return

  var now = new Date()
  var ny = now.getFullYear()
  var nm = now.getMonth() + 1
  var nd = now.getDate()
  var todayStr = ny + '-' + (nm < 10 ? '0' + nm : nm) + '-' + (nd < 10 ? '0' + nd : nd)

  var reviewQuestions = []
  try {
    reviewQuestions = $app.findRecordsByFilter(
      'questoes',
      'status = "errou" && revisao_agendada >= "2020-01-01" && revisao_agendada <= {:today}',
      'revisao_agendada',
      50,
      0,
      { today: todayStr },
    )
  } catch (_) {}

  if (reviewQuestions.length === 0) return

  var byPilde = {}
  for (var i = 0; i < reviewQuestions.length; i++) {
    var pid = reviewQuestions[i].get('pildes_id')
    if (!pid) continue
    if (!byPilde[pid]) byPilde[pid] = true
  }

  var missoesCol = $app.findCollectionByNameOrId('missoes')

  for (var pildeId in byPilde) {
    var existing = []
    try {
      existing = $app.findRecordsByFilter(
        'missoes',
        'data~{:d} && usuario_id = {:uid} && pildes_id = {:pid}',
        '',
        1,
        0,
        { d: todayStr, uid: alunoId, pid: pildeId },
      )
    } catch (_) {}
    if (existing.length > 0) continue

    var pildeTitle = 'Revisão'
    try {
      var pilde = $app.findRecordById('pildes', pildeId)
      pildeTitle = pilde.get('titulo')
    } catch (_) {}

    var todayMissoes = []
    try {
      todayMissoes = $app.findRecordsByFilter(
        'missoes',
        'data~{:d} && usuario_id = {:uid}',
        'ordem',
        20,
        0,
        { d: todayStr, uid: alunoId },
      )
    } catch (_) {}

    var rec = new Record(missoesCol)
    rec.set('usuario_id', alunoId)
    rec.set('data', todayStr)
    rec.set('titulo', 'Revisão: ' + pildeTitle)
    rec.set('pildes_id', pildeId)
    rec.set('ordem', todayMissoes.length + 1)
    rec.set('status', 'pendente')
    $app.save(rec)
  }
})
