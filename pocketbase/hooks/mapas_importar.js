// Extração de conteúdo de documentos enviados pelo aluno (PDF, DOCX, TXT)
// para alimentar a geração de mapas mentais. Usa o leitor nativo do Skip Cloud.
routerAdd(
  'POST',
  '/backend/v1/mapas-importar',
  (e) => {
    var userId = e.auth && e.auth.id
    if (!userId) return e.unauthorizedError('Autenticação necessária')

    var form = e.requestInfo().body
    var textoColado = (form && form.texto) || ''

    var fs = $os.tempDir()
    var extraido = ''
    var parcial = false

    try {
      var files = e.findUploadedFiles('arquivo')
      if (files.length > 0) {
        var f = files[0]
        if (f.size > 15 * 1024 * 1024) {
          return e.badRequestError('Arquivo muito grande (máximo 15 MB)')
        }
        var ext = ''
        var name = f.original_filename || ''
        var dot = name.lastIndexOf('.')
        if (dot >= 0) ext = name.substring(dot).toLowerCase()
        if (
          ['.pdf', '.docx', '.txt', '.md', '.csv', '.html', '.htm', '.pptx', '.xlsx'].indexOf(
            ext,
          ) === -1
        ) {
          return e.badRequestError(
            'Formato não suportado. Envie PDF, DOCX, TXT, MD, CSV ou cole o texto.',
          )
        }
        var dest = fs + '/mapas_entrada_' + userId + ext
        e.saveUploadedFile(f, dest)

        try {
          extraido = $documents.toMarkdown(dest)
        } catch (errDoc) {
          console.log('mapas-importar: falha ao ler documento: ' + errDoc)
          return e.json(422, {
            error:
              'Não consegui ler este arquivo completamente. Tente converter para PDF ou TXT, ou cole o texto.',
          })
        }
        // limpa o diretório temporário com o arquivo salvo
        $os.removeAll(fs)
      } else if (textoColado && String(textoColado).trim()) {
        extraido = String(textoColado).slice(0, 30000)
      } else {
        return e.badRequestError('Envie um arquivo ou cole um texto')
      }
    } finally {
      // safety: garante limpeza mesmo se algo falhar antes do removeAll
    }

    if (!extraido || !String(extraido).trim()) {
      return e.json(422, {
        error: 'O arquivo não tem texto legível (pode ser escaneado). Tente colar o texto.',
      })
    }

    var truncado = String(extraido).length > 30000
    var textoFinal = String(extraido).slice(0, 30000)

    return e.json(200, {
      data: { texto: textoFinal, truncado: truncado, caracteres: String(extraido).length },
    })
  },
  $apis.requireAuth(),
)
