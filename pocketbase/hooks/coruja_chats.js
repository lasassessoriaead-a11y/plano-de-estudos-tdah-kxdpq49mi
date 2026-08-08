routerAdd(
  'GET',
  '/backend/v1/coruja/messages/{conversationId}',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const conversationId = e.request.pathValue('conversationId')
      const res = $ai.agent('coruja-mentora').listMessages({
        conversation_id: conversationId,
        user_id: userId,
      })
      return e.json(200, res)
    } catch (err) {
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, { error: status >= 500 ? 'Erro ao carregar mensagens' : err.message })
      }
      throw err
    }
  },
  $apis.requireAuth(),
)
