/**
 * XP e conquistas — calculados e registrados NO SERVIDOR (impossível manipular no cliente).
 * XP: 100 por missão concluída, 10 por questão respondida. Nível: 1 a cada 500 XP.
 * Idempotente: uma transação de XP por referência (missao/questao id) + origem.
 */

onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')
  if (oldStatus === 'concluida' || newStatus !== 'concluida') return e.next()

  const userId = e.record.getString('usuario_id')
  try {
    // lança XP se ainda não existir transação para esta missão
    let jaTem = false
    try {
      $app.findFirstRecordByFilter(
        'xp_transactions',
        'usuario_id = {:uid} && referencia_id = {:rid} && origem = "missao"',
        { uid: userId, rid: e.record.id },
      )
      jaTem = true
    } catch (_) {}
    if (!jaTem) {
      const xpCol = $app.findCollectionByNameOrId('xp_transactions')
      const tx = new Record(xpCol)
      tx.set('usuario_id', userId)
      tx.set('quantidade', 100)
      tx.set('motivo', 'Missão de sprint concluída')
      tx.set('origem', 'missao')
      tx.set('referencia_id', e.record.id)
      $app.save(tx)
    }

    // conquistas: limiares por condicao, comparados com dados reais
    const conquistas = $app.findRecordsByFilter('achievements', '', '', 200, 0)
    for (const ach of conquistas) {
      const condicao = ach.getString('condicao')
      const limiar = ach.getInt('limiar')
      if (!condicao || limiar <= 0) continue
      let jaTemAch = false
      try {
        $app.findFirstRecordByFilter(
          'user_achievements',
          'usuario_id = {:uid} && achievement_id = {:aid}',
          { uid: userId, aid: ach.id },
        )
        jaTemAch = true
      } catch (_) {}
      if (jaTemAch) continue

      let valorAtual = 0
      if (condicao === 'missoes_concluidas') {
        valorAtual = $app.countRecords('missoes', 'usuario_id = {:uid} && status = "concluida"', {
          uid: userId,
        })
      } else if (condicao === 'questoes_resolvidas') {
        valorAtual = $app.countRecords(
          'questoes',
          'usuario_id = {:uid} && (status = "acertou" || status = "errou")',
          { uid: userId },
        )
      } else if (condicao === 'acertos') {
        valorAtual = $app.countRecords('questoes', 'usuario_id = {:uid} && status = "acertou"', {
          uid: userId,
        })
      } else if (condicao === 'streak_dias') {
        const dias = $app.findRecordsByFilter(
          'missoes',
          'usuario_id = {:uid} && status = "concluida"',
          '-data',
          400,
          0,
          { uid: userId },
        )
        const setDias = new Set()
        for (const m of dias) {
          const d = m.getString('data').slice(0, 10)
          if (d) setDias.add(d)
        }
        let streak = 0
        const cursor = new Date()
        for (let i = 0; i < 400; i++) {
          const y = cursor.getFullYear()
          const mo = cursor.getMonth() + 1
          const dd = cursor.getDate()
          const key = y + '-' + (mo < 10 ? '0' + mo : mo) + '-' + (dd < 10 ? '0' + dd : dd)
          if (setDias.has(key)) {
            streak++
          } else if (streak > 0) {
            break
          } else if (i === 0 && !setDias.has(key)) {
            // dia de hoje ainda não concluído: começa a contar de ontem
          } else {
            break
          }
          cursor.setDate(cursor.getDate() - 1)
        }
        valorAtual = streak
      } else if (condicao === 'tempo_estudado') {
        valorAtual = $app.countRecords('missoes', 'usuario_id = {:uid} && status = "concluida"', {
          uid: userId,
        })
      }
      if (valorAtual < limiar) continue

      const uaCol = $app.findCollectionByNameOrId('user_achievements')
      const rec = new Record(uaCol)
      rec.set('usuario_id', userId)
      rec.set('achievement_id', ach.id)
      $app.save(rec)

      const xpBonus = ach.getInt('xp_recompensa')
      if (xpBonus > 0) {
        const xpCol = $app.findCollectionByNameOrId('xp_transactions')
        const txb = new Record(xpCol)
        txb.set('usuario_id', userId)
        txb.set('quantidade', xpBonus)
        txb.set('motivo', 'Conquista: ' + ach.getString('nome'))
        txb.set('origem', 'conquista')
        txb.set('referencia_id', ach.id)
        $app.save(txb)
      }

      try {
        const nCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(nCol)
        notif.set('usuario_id', userId)
        notif.set('titulo', 'Nova conquista desbloqueada!')
        notif.set('mensagem', ach.getString('nome') + ' — ' + ach.getString('descricao'))
        notif.set('tipo', 'conquista')
        notif.set('lida', false)
        $app.save(notif)
      } catch (_) {}
    }
  } catch (err) {
    $app.logger().error('xp/conquistas falhou para missão ' + e.record.id, 'error', String(err))
  }
  return e.next()
}, 'missoes')

onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')
  const statusValido = newStatus === 'acertou' || newStatus === 'errou'
  const jaEraValido = oldStatus === 'acertou' || oldStatus === 'errou'
  if (!statusValido || jaEraValido) return e.next()

  const userId = e.record.getString('usuario_id')
  try {
    let jaTem = false
    try {
      $app.findFirstRecordByFilter(
        'xp_transactions',
        'usuario_id = {:uid} && referencia_id = {:rid} && origem = "questao"',
        { uid: userId, rid: e.record.id },
      )
      jaTem = true
    } catch (_) {}
    if (!jaTem) {
      const xpCol = $app.findCollectionByNameOrId('xp_transactions')
      const tx = new Record(xpCol)
      tx.set('usuario_id', userId)
      tx.set('quantidade', 10)
      tx.set('motivo', newStatus === 'acertou' ? 'Questão acertada' : 'Questão resolvida')
      tx.set('origem', 'questao')
      tx.set('referencia_id', e.record.id)
      $app.save(tx)
    }

    const conquistas = $app.findRecordsByFilter('achievements', '', '', 200, 0)
    for (const ach of conquistas) {
      const condicao = ach.getString('condicao')
      const limiar = ach.getInt('limiar')
      if (!condicao || limiar <= 0) continue
      if (condicao !== 'questoes_resolvidas' && condicao !== 'acertos') continue

      let jaTemAch = false
      try {
        $app.findFirstRecordByFilter(
          'user_achievements',
          'usuario_id = {:uid} && achievement_id = {:aid}',
          { uid: userId, aid: ach.id },
        )
        jaTemAch = true
      } catch (_) {}
      if (jaTemAch) continue

      let valorAtual = 0
      if (condicao === 'questoes_resolvidas') {
        valorAtual = $app.countRecords(
          'questoes',
          'usuario_id = {:uid} && (status = "acertou" || status = "errou")',
          { uid: userId },
        )
      } else {
        valorAtual = $app.countRecords('questoes', 'usuario_id = {:uid} && status = "acertou"', {
          uid: userId,
        })
      }
      if (valorAtual < limiar) continue

      const uaCol = $app.findCollectionByNameOrId('user_achievements')
      const rec = new Record(uaCol)
      rec.set('usuario_id', userId)
      rec.set('achievement_id', ach.id)
      $app.save(rec)

      const xpBonus = ach.getInt('xp_recompensa')
      if (xpBonus > 0) {
        const xpCol = $app.findCollectionByNameOrId('xp_transactions')
        const txb = new Record(xpCol)
        txb.set('usuario_id', userId)
        txb.set('quantidade', xpBonus)
        txb.set('motivo', 'Conquista: ' + ach.getString('nome'))
        txb.set('origem', 'conquista')
        txb.set('referencia_id', ach.id)
        $app.save(txb)
      }

      try {
        const nCol = $app.findCollectionByNameOrId('notifications')
        const notif = new Record(nCol)
        notif.set('usuario_id', userId)
        notif.set('titulo', 'Nova conquista desbloqueada!')
        notif.set('mensagem', ach.getString('nome') + ' — ' + ach.getString('descricao'))
        notif.set('tipo', 'conquista')
        notif.set('lida', false)
        $app.save(notif)
      } catch (_) {}
    }
  } catch (err) {
    $app.logger().error('xp/conquistas falhou para questão ' + e.record.id, 'error', String(err))
  }
  return e.next()
}, 'questoes')
