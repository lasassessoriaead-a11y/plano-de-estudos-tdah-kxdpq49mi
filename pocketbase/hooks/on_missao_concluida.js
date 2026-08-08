onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (oldStatus !== 'concluida' && newStatus === 'concluida') {
    const missaoId = e.record.id
    const userId = e.record.getString('usuario_id')

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
  }

  return e.next()
}, 'missoes')
