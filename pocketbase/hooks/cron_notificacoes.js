cronAdd('notificacoes_check', '* * * * *', () => {
  var configs = []
  try {
    configs = $app.findRecordsByFilter('config_alertas', '1=1', '', 100, 0)
  } catch (_) {
    return
  }

  if (configs.length === 0) return

  var now = new Date()
  var y = now.getFullYear()
  var m = now.getMonth() + 1
  var d = now.getDate()
  var todayStr = y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d)
  var h = now.getHours()
  var min = now.getMinutes()
  var currentHHMM = (h < 10 ? '0' + h : h) + ':' + (min < 10 ? '0' + min : min)

  var notifCol = null
  try {
    notifCol = $app.findCollectionByNameOrId('notificacoes')
  } catch (_) {
    return
  }

  for (var i = 0; i < configs.length; i++) {
    var config = configs[i]
    var responsavelId = config.getString('usuario_id')
    var whatsappAluno = config.getString('whatsapp_aluno')
    var whatsappResp = config.getString('whatsapp_responsavel')
    var horarioLembrete = config.getString('horario_lembrete')
    var horarioVerificacao = config.getString('horario_verificacao')

    if (horarioLembrete === currentHHMM && whatsappAluno) {
      var existingReminder = []
      try {
        existingReminder = $app.findRecordsByFilter(
          'notificacoes',
          'tipo = {:t} && data~{:d} && usuario_id = {:uid}',
          '',
          1,
          0,
          { t: 'lembrete_estudo', d: todayStr, uid: responsavelId },
        )
      } catch (_) {}

      if (existingReminder.length === 0) {
        try {
          var notif1 = new Record(notifCol)
          notif1.set('usuario_id', responsavelId)
          notif1.set('tipo', 'lembrete_estudo')
          notif1.set('destino', whatsappAluno)
          notif1.set('conteudo', 'Lembrete: hora de estudar, Luis Gustavo!')
          notif1.set('data', todayStr)
          notif1.set('status', 'pendente')
          $app.save(notif1)
        } catch (err) {
          $app.logger().error('failed to create lembrete_estudo notification', 'error', String(err))
        }
      }
    }

    if (horarioVerificacao === currentHHMM && whatsappResp) {
      var existingAlert = []
      try {
        existingAlert = $app.findRecordsByFilter(
          'notificacoes',
          'tipo = {:t} && data~{:d} && usuario_id = {:uid}',
          '',
          1,
          0,
          { t: 'tarefa_nao_cumprida', d: todayStr, uid: responsavelId },
        )
      } catch (_) {}

      if (existingAlert.length === 0) {
        var alunoId = ''
        try {
          var alunos = $app.findRecordsByFilter('users', 'role = {:r}', '', 1, 0, { r: 'aluno' })
          if (alunos.length > 0) alunoId = alunos[0].id
        } catch (_) {}

        if (alunoId) {
          var dayMissoes = []
          try {
            dayMissoes = $app.findRecordsByFilter(
              'missoes',
              'data~"' + todayStr + '" && usuario_id = "' + alunoId + '"',
              'ordem',
              100,
              0,
            )
          } catch (_) {}

          var allConcluida = dayMissoes.length > 0
          for (var j = 0; j < dayMissoes.length; j++) {
            if (dayMissoes[j].getString('status') !== 'concluida') {
              allConcluida = false
              break
            }
          }

          if (!allConcluida) {
            try {
              var notif2 = new Record(notifCol)
              notif2.set('usuario_id', responsavelId)
              notif2.set('tipo', 'tarefa_nao_cumprida')
              notif2.set('destino', whatsappResp)
              notif2.set('conteudo', 'Luis Gustavo nao cumpriu a tarefa do dia')
              notif2.set('data', todayStr)
              notif2.set('status', 'pendente')
              $app.save(notif2)
            } catch (err) {
              $app
                .logger()
                .error('failed to create tarefa_nao_cumprida notification', 'error', String(err))
            }
          }
        }
      }
    }
  }
})
