cronAdd('gerar_missoes', '0 5 * * *', () => {
  var examDate = '2026-11-01'
  try {
    var configs = $app.findRecordsByFilter('config_alertas', '1=1', '', 1, 0)
    if (configs.length > 0 && configs[0].getString('exam_date')) {
      examDate = configs[0].getString('exam_date')
    }
  } catch (_) {}

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

  var matPeso = {}
  try {
    var materias = $app.findRecordsByFilter('materias', '1=1', 'ordem', 50, 0)
    for (var mi = 0; mi < materias.length; mi++) {
      matPeso[materias[mi].id] = materias[mi].get('peso') || 1
    }
  } catch (_) {}

  var topicos = []
  try {
    topicos = $app.findRecordsByFilter('topicos', '1=1', 'prioridade', 500, 0)
  } catch (_) {}
  topicos.sort(function (a, b) {
    var pa = a.get('prioridade') || 99
    var pb = b.get('prioridade') || 99
    if (pa !== pb) return pa - pb
    var ma = matPeso[a.get('materia_id')] || 1
    var mb = matPeso[b.get('materia_id')] || 1
    return mb - ma
  })

  var assignedPildes = {}
  try {
    var existingMissoes = $app.findRecordsByFilter(
      'missoes',
      'usuario_id = {:uid}',
      'data',
      2000,
      0,
      { uid: alunoId },
    )
    for (var ei = 0; ei < existingMissoes.length; ei++) {
      assignedPildes[existingMissoes[ei].get('pildes_id')] = true
    }
  } catch (_) {}

  var pildesByTopico = {}
  try {
    var allPildes = $app.findRecordsByFilter('pildes', '1=1', '', 1000, 0)
    for (var pi = 0; pi < allPildes.length; pi++) {
      pildesByTopico[allPildes[pi].get('topico_id')] = allPildes[pi]
    }
  } catch (_) {}

  var unassigned = []
  var pildesCol = $app.findCollectionByNameOrId('pildes')
  var matNomeById = {}
  try {
    var mats = $app.findRecordsByFilter('materias', '1=1', '', 50, 0)
    for (var mk = 0; mk < mats.length; mk++) {
      matNomeById[mats[mk].id] = mats[mk].get('nome')
    }
  } catch (_) {}

  for (var ti = 0; ti < topicos.length; ti++) {
    var topico = topicos[ti]
    var pilde = pildesByTopico[topico.id]
    if (!pilde) {
      pilde = new Record(pildesCol)
      pilde.set('topico_id', topico.id)
      pilde.set('titulo', topico.get('titulo'))
      var matNome = matNomeById[topico.get('materia_id')] || ''
      var tipo = topico.get('tipo') || 'fluxograma'
      var formato = 'fluxograma'
      if (matNome === 'Redação') formato = 'esqueleto_redacao'
      else if (tipo === 'pratica') formato = 'topicos_diretos'
      else if (tipo === 'esqueleto') formato = 'esquema'
      pilde.set('formato', formato)
      pilde.set('duracao_teorica', 10)
      $app.save(pilde)
      pildesByTopico[topico.id] = pilde
    }
    if (!assignedPildes[pilde.id]) {
      unassigned.push({ topico: topico, pilde: pilde })
    }
  }

  var now = new Date()
  var exam = new Date(examDate + 'T00:00:00')
  var missoesCol = $app.findCollectionByNameOrId('missoes')
  var cycleIdx = 0

  for (var day = 0; day < 14; day++) {
    var date = new Date(now.getTime() + day * 24 * 60 * 60 * 1000)
    if (date > exam) break
    var dy = date.getFullYear()
    var dm = date.getMonth() + 1
    var dd = date.getDate()
    var dateStr = dy + '-' + (dm < 10 ? '0' + dm : dm) + '-' + (dd < 10 ? '0' + dd : dd)

    var existingDay = []
    try {
      existingDay = $app.findRecordsByFilter(
        'missoes',
        'data~{:d} && usuario_id = {:uid}',
        'ordem',
        10,
        0,
        { d: dateStr, uid: alunoId },
      )
    } catch (_) {}
    if (existingDay.length > 0) continue

    for (var m = 0; m < 3; m++) {
      if (unassigned.length > 0) {
        var item = unassigned.shift()
        var rec = new Record(missoesCol)
        rec.set('usuario_id', alunoId)
        rec.set('data', dateStr)
        rec.set('titulo', item.topico.get('titulo'))
        rec.set('pildes_id', item.pilde.id)
        rec.set('ordem', m + 1)
        rec.set('status', 'pendente')
        $app.save(rec)
      } else {
        if (topicos.length === 0) break
        var ct = topicos[cycleIdx % topicos.length]
        var cp = pildesByTopico[ct.id]
        if (!cp) {
          cycleIdx++
          continue
        }
        cycleIdx++
        var cr = new Record(missoesCol)
        cr.set('usuario_id', alunoId)
        cr.set('data', dateStr)
        cr.set('titulo', 'Revisão: ' + ct.get('titulo'))
        cr.set('pildes_id', cp.id)
        cr.set('ordem', m + 1)
        cr.set('status', 'pendente')
        $app.save(cr)
      }
    }
  }
})
