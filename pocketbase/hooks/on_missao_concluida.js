onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus !== 'concluida' && newStatus === 'concluida') {
    const missaoId = e.record.id
    const userId = e.record.getString('usuario_id')
    const dataStr = e.record.getString('data')

    try {
      const rewards = $app.findRecordsByFilter(
        'recompensas',
        'missao_id = {:mid} && usuario_id = {:uid}',
        'created',
        100,
        0,
        { mid: missaoId, uid: userId },
      )

      for (const reward of rewards) {
        if (reward.getString('status') !== 'disponivel') {
          reward.set('status', 'disponivel')
          $app.save(reward)
        }
      }
    } catch (err) {
      $app.logger().error('auto-credit failed for mission ' + missaoId, 'error', String(err))
    }

    try {
      var dayMissoes = $app.findRecordsByFilter(
        'missoes',
        'data~"' + dataStr + '" && usuario_id = "' + userId + '"',
        'ordem',
        100,
        0,
      )

      var allConcluida = dayMissoes.length > 0
      for (var i = 0; i < dayMissoes.length; i++) {
        if (dayMissoes[i].getString('status') !== 'concluida') {
          allConcluida = false
          break
        }
      }

      if (allConcluida) {
        var respRecords = $app.findRecordsByFilter('users', 'role = {:r}', '', 1, 0, {
          r: 'responsavel',
        })
        if (respRecords.length === 0) return e.next()
        var responsavelId = respRecords[0].id

        var dailyTitulo = 'Recompensa Diaria - ' + dataStr
        var existingDaily = $app.findRecordsByFilter(
          'recompensas',
          'titulo = {:t} && usuario_id = {:uid}',
          '',
          1,
          0,
          { t: dailyTitulo, uid: responsavelId },
        )

        if (existingDaily.length === 0) {
          var recompensasCol = $app.findCollectionByNameOrId('recompensas')
          var dailyReward = new Record(recompensasCol)
          dailyReward.set('usuario_id', responsavelId)
          dailyReward.set('missao_id', missaoId)
          dailyReward.set('titulo', dailyTitulo)
          dailyReward.set('tipo', 'dinheiro')
          dailyReward.set('valor', 15)
          dailyReward.set('status', 'disponivel')
          $app.save(dailyReward)

          var allDailyRewards = $app.findRecordsByFilter(
            'recompensas',
            'usuario_id = {:uid} && valor = 15',
            'created',
            1000,
            0,
            { uid: responsavelId },
          )

          var completedDays = allDailyRewards.length

          if (completedDays > 0 && completedDays % 10 === 0) {
            var cicloNum = completedDays / 10
            var bonusTitulo = 'Bonus de 10 Dias - Ciclo ' + cicloNum
            var existingBonus = $app.findRecordsByFilter(
              'recompensas',
              'titulo = {:t} && usuario_id = {:uid}',
              '',
              1,
              0,
              { t: bonusTitulo, uid: responsavelId },
            )

            if (existingBonus.length === 0) {
              var bonusReward = new Record(recompensasCol)
              bonusReward.set('usuario_id', responsavelId)
              bonusReward.set('missao_id', missaoId)
              bonusReward.set('titulo', bonusTitulo)
              bonusReward.set('tipo', 'dinheiro')
              bonusReward.set('valor', 150)
              bonusReward.set('status', 'disponivel')
              $app.save(bonusReward)
            }
          }
        }
      }
    } catch (err) {
      $app.logger().error('silent reward check failed', 'error', String(err))
    }
  }

  return e.next()
}, 'missoes')
