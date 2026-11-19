// 0025 — Redação do ENEM no simulado do 1º dia.
// Coleção nova: sim_redacao_temas (temas autorais estilo ENEM, owner-only).
// Campos novos (sem tocar em nada existente):
//   simulados.incluir_redacao (bool) + simulados.tema_id (relation → sim_redacao_temas)
//   simulado_tentativas.redacao_texto (editor) + simulado_tentativas.redacao_avaliacao (json)
//     + simulado_tentativas.redacao_nota_real (number, correção humana posterior)
migrate(
  (app) => {
    // ---------- 1) Coleção de temas de redação (autorais) ----------
    if (!app.hasTable('sim_redacao_temas')) {
      const temas = new Collection({
        name: 'sim_redacao_temas',
        type: 'base',
        listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        fields: [
          {
            name: 'usuario_id',
            type: 'relation',
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'titulo', type: 'text', required: true, maxSize: 300 },
          { name: 'textos_motivadores', type: 'json', required: true, maxSize: 120000 },
          { name: 'instrucoes', type: 'text', maxSize: 4000 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_simredtemas_usuario ON sim_redacao_temas (usuario_id)'],
      })
      app.save(temas)
    }

    const temaCol = app.findCollectionByNameOrId('sim_redacao_temas')

    // ---------- 2) Tema autoral estilo ENEM (seed idempotente, owner-only) ----------
    var existentes = []
    try {
      existentes = app.findRecordsByFilter('sim_redacao_temas', '', '', 1, 0)
    } catch (_) {}
    if (existentes.length === 0) {
      const ownerId = 'aeu70i257a4in61'
      const rec = new Record(temaCol)
      rec.set('usuario_id', ownerId)
      rec.set('titulo', 'Democratização da leitura no Brasil')
      rec.set(
        'textos_motivadores',
        JSON.stringify([
          'Segundo a pesquisa Retratos da Leitura no Brasil, o país teve queda no número de leitores habituais nos últimos anos: uma parcela crescente da população declara não ter lido nenhum livro nos doze meses anteriores à pesquisa. Ao mesmo tempo, estudos mostram que o contato com a leitura na infância, especialmente com a mediação de adultos leitores, é um dos principais fatores para a formação de novos leitores.',
          'Em reportagem publicada em um jornal de circulação nacional, uma bibliotecária comunitária de uma periferia relatou que, após a abertura de uma biblioteca de bairro com acervo doado, a demanda por empréstimos triplicou em dois anos. Para ela, "o problema não é que o brasileiro não queira ler; é que muitos nunca tiveram um livro ao alcance das mãos".',
          'O escritor e professor Rubem Alves afirmou que "a leitura é um processo no qual o leitor realiza um trabalho ativo de construção do significado do texto, a partir dos seus objetivos, do seu conhecimento sobre o assunto e de sua experiência". No entanto, grande parte das escolas brasileiras ainda trabalha a leitura apenas como tarefa de decodificação, sem diálogo com a vida do estudante.',
          'Cartum: uma criança sentada na calçada folheia um livro com atenção enquanto, ao fundo, adultos passam apressados com os olhos grudados nos celulares. Na legenda: "O único silêncio possível na cidade grande".',
        ]),
      )
      rec.set(
        'instrucoes',
        'A partir dos textos motivadores e dos conhecimentos construídos ao longo de sua formação, escreva um texto DISSERTATIVO-ARGUMENTATIVO EM PROSA, de no máximo 30 linhas, sobre a democratização da leitura no Brasil. Seu texto deve apresentar proposta de intervenção que respeite os direitos humanos, contendo os cinco elementos exigidos: agente, ação, meio/modo, finalidade e detalhamento.',
      )
      app.save(rec)
    }

    // ---------- 3) Campos novos em 'simulados' ----------
    const sim = app.findCollectionByNameOrId('simulados')
    if (!sim.fields.getByName('incluir_redacao')) {
      sim.fields.add(new BoolField({ name: 'incluir_redacao' }))
    }
    if (!sim.fields.getByName('tema_id')) {
      sim.fields.add(
        new RelationField({
          name: 'tema_id',
          collectionId: temaCol.id,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(sim)

    // ---------- 4) Campos novos em 'simulado_tentativas' ----------
    const te = app.findCollectionByNameOrId('simulado_tentativas')
    if (!te.fields.getByName('redacao_texto')) {
      te.fields.add(new EditorField({ name: 'redacao_texto', maxSize: 200000 }))
    }
    if (!te.fields.getByName('redacao_avaliacao')) {
      te.fields.add(new JSONField({ name: 'redacao_avaliacao', maxSize: 200000 }))
    }
    if (!te.fields.getByName('redacao_nota_real')) {
      te.fields.add(
        new NumberField({ name: 'redacao_nota_real', onlyInt: true, min: 0, max: 1000 }),
      )
    }
    app.save(te)
  },
  (app) => {
    try {
      const te = app.findCollectionByNameOrId('simulado_tentativas')
      for (const f of ['redacao_nota_real', 'redacao_avaliacao', 'redacao_texto']) {
        const fld = te.fields.getByName(f)
        if (fld) te.fields.removeByName(f)
      }
      app.save(te)
    } catch (_) {}
    try {
      const sim = app.findCollectionByNameOrId('simulados')
      for (const f of ['tema_id', 'incluir_redacao']) {
        const fld = sim.fields.getByName(f)
        if (fld) sim.fields.removeByName(f)
      }
      app.save(sim)
    } catch (_) {}
    try {
      const temas = app.findCollectionByNameOrId('sim_redacao_temas')
      app.delete(temas)
    } catch (_) {}
  },
)
