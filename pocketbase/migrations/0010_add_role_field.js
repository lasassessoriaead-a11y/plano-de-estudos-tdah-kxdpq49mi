migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!col.fields.getByName('role')) {
      col.fields.add(
        new SelectField({
          name: 'role',
          values: ['responsavel', 'aluno'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)

    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com')
      user.set('role', 'aluno')
      app.save(user)
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('_pb_users_auth_')
      const field = col.fields.getByName('role')
      if (field) {
        col.fields.remove(field)
        app.save(col)
      }
    } catch (_) {}
  },
)
