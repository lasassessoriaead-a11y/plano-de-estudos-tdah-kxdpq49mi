migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com')
      user.set('name', 'Luis Gustavo')
      app.save(user)
    } catch (_) {}
  },
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com')
      user.set('name', 'Estudante TDAH')
      app.save(user)
    } catch (_) {}
  },
)
