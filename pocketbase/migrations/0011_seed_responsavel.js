migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'responsavel@skip.app')
      return
    } catch (_) {}

    const record = new Record(usersCol)
    record.setEmail('responsavel@skip.app')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Responsável')
    record.set('role', 'responsavel')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'responsavel@skip.app')
      app.delete(record)
    } catch (_) {}
  },
)
