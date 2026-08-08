onRecordUpdate((e) => {
  var newStatus = e.record.getString('status')
  var oldStatus = e.record.original().getString('status')

  if (newStatus === 'errou') {
    var now = new Date()
    var days = oldStatus === 'errou' ? 3 : 1
    var reviewDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    var ry = reviewDate.getFullYear()
    var rm = reviewDate.getMonth() + 1
    var rd = reviewDate.getDate()
    var reviewStr = ry + '-' + (rm < 10 ? '0' + rm : rm) + '-' + (rd < 10 ? '0' + rd : rd)
    e.record.set('revisao_agendada', reviewStr)
  }

  if (newStatus === 'acertou') {
    e.record.set('revisao_agendada', '')
  }

  e.next()
}, 'questoes')
