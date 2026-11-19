// Central de Simulados Inteligentes NEXORA — novas coleções.
// Regra: dados do ALUNO são owner-only (usuario_id = @request.auth.id);
// dados de CATÁLOGO (instituições, bancas, provas de referência) são globais
// para leitura de qualquer usuário autenticado (seed via migração, escrita só admin);
// coleções do admin (revisão de IA, importação) são owner-only também, com flag
// "aprovado" controlando o que entra no banco público do usuário.
migrate(
  (app) => {
    const usersId = '_pb_users_auth_'

    const ownerRules = {
      listRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
    }
    const globalReadRules = {
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null, // catálogo só via migração/admin (sem API pública de escrita)
      updateRule: null,
      deleteRule: null,
    }
    const ownerRel = {
      name: 'usuario_id',
      type: 'relation',
      required: true,
      collectionId: usersId,
      cascadeDelete: true,
      maxSelect: 1,
    }
    const autodates = [
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]

    // ---------- sim_instituicoes (catálogo global) ----------
    app.save(
      new Collection({
        name: 'sim_instituicoes',
        type: 'base',
        ...globalReadRules,
        fields: [
          { name: 'nome', type: 'text', required: true, maxSize: 160 },
          { name: 'sigla', type: 'text', maxSize: 40 },
          {
            name: 'categoria',
            type: 'select',
            required: true,
            values: ['vestibular', 'faculdade_particular', 'universidade_publica', 'concurso'],
            maxSelect: 1,
          },
          { name: 'tipo', type: 'select', values: ['publica', 'particular'], maxSelect: 1 },
          { name: 'bancas', type: 'text', maxSize: 400 }, // nomes separados por vírgula
          { name: 'descricao', type: 'text', maxSize: 2000 },
          { name: 'formato_json', type: 'json', maxSize: 20000 }, // formato da prova (dados conservadores)
          { name: 'cursos', type: 'text', maxSize: 2000 },
          { name: 'ativa', type: 'bool' },
          ...autodates,
        ],
        indexes: ['CREATE UNIQUE INDEX idx_siminst_nome ON sim_instituicoes (nome)'],
      }),
    )

    // ---------- sim_bancas (catálogo global) ----------
    app.save(
      new Collection({
        name: 'sim_bancas',
        type: 'base',
        ...globalReadRules,
        fields: [
          { name: 'nome', type: 'text', required: true, maxSize: 120 },
          {
            name: 'estilo',
            type: 'select',
            values: ['multipla_escolha', 'certo_errado', 'discursiva', 'misto'],
            maxSelect: 1,
          },
          { name: 'descricao', type: 'text', maxSize: 1000 },
          ...autodates,
        ],
        indexes: ['CREATE UNIQUE INDEX idx_simbancas_nome ON sim_bancas (nome)'],
      }),
    )

    // ---------- sim_provas (provas anteriores de referência) ----------
    app.save(
      new Collection({
        name: 'sim_provas',
        type: 'base',
        ...globalReadRules,
        fields: [
          { name: 'instituicao', type: 'text', required: true, maxSize: 160 },
          { name: 'banca', type: 'text', maxSize: 120 },
          { name: 'ano', type: 'number', required: true, onlyInt: true },
          { name: 'fase', type: 'text', maxSize: 120 },
          { name: 'curso_cargo', type: 'text', maxSize: 200 },
          { name: 'titulo', type: 'text', required: true, maxSize: 250 },
          { name: 'materias', type: 'text', maxSize: 2000 },
          { name: 'total_questoes', type: 'number', onlyInt: true },
          { name: 'duracao_min', type: 'number', onlyInt: true },
          { name: 'ativo', type: 'bool' },
          ...autodates,
        ],
        indexes: ['CREATE INDEX idx_simprovas_inst ON sim_provas (instituicao)'],
      }),
    )

    // ---------- sim_questoes_expandidas (banco inteligente: vestibular/concurso) ----------
    // Leitura: usuário vê questões APROVADAS globais + as próprias (criadas por IA).
    app.save(
      new Collection({
        name: 'sim_questoes_expandidas',
        type: 'base',
        listRule: "@request.auth.id != '' && (aprovada = true || usuario_id = @request.auth.id)",
        viewRule: "@request.auth.id != '' && (aprovada = true || usuario_id = @request.auth.id)",
        createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        updateRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        deleteRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
        fields: [
          ownerRel,
          { name: 'enunciado', type: 'text', required: true, maxSize: 12000 },
          { name: 'alternativas', type: 'json', required: true, maxSize: 60000 },
          { name: 'gabarito', type: 'number', onlyInt: true, min: 0, max: 9 },
          { name: 'gabarito_texto', type: 'text', maxSize: 8000 }, // discursivas
          { name: 'resolucao', type: 'text', maxSize: 200000 },
          { name: 'materia', type: 'text', maxSize: 160 },
          { name: 'assunto', type: 'text', maxSize: 300 },
          {
            name: 'tipo_questao',
            type: 'select',
            required: true,
            values: ['multipla_escolha', 'certo_errado', 'discursiva'],
            maxSelect: 1,
          },
          {
            name: 'dificuldade',
            type: 'select',
            values: ['facil', 'medio', 'dificil'],
            maxSelect: 1,
          },
          { name: 'ano', type: 'number', onlyInt: true },
          { name: 'instituicao', type: 'text', maxSize: 160 },
          { name: 'banca', type: 'text', maxSize: 120 },
          { name: 'curso_cargo', type: 'text', maxSize: 200 },
          { name: 'fonte', type: 'text', maxSize: 250 },
          {
            name: 'origem',
            type: 'select',
            required: true,
            values: ['oficial_autorizada', 'gerada_ia'],
            maxSelect: 1,
          },
          { name: 'aprovada', type: 'bool' },
          { name: 'gerada_por_simulado_id', type: 'text', maxSize: 40 },
          { name: 'hash_duplicata', type: 'text', maxSize: 80 },
          ...autodates,
        ],
        indexes: [
          'CREATE INDEX idx_simqexp_materia ON sim_questoes_expandidas (materia)',
          'CREATE INDEX idx_simqexp_inst ON sim_questoes_expandidas (instituicao)',
          'CREATE INDEX idx_simqexp_hash ON sim_questoes_expandidas (hash_duplicata)',
        ],
      }),
    )

    // ---------- sim_editais (upload de PDF de edital, owner-only) ----------
    app.save(
      new Collection({
        name: 'sim_editais',
        ...ownerRules,
        fields: [
          ownerRel,
          { name: 'titulo', type: 'text', required: true, maxSize: 250 },
          { name: 'orgao', type: 'text', maxSize: 200 },
          { name: 'banca', type: 'text', maxSize: 120 },
          {
            name: 'arquivo',
            type: 'file',
            required: true,
            maxSize: 15728640,
            mimeTypes: ['application/pdf'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['enviado', 'processando', 'processado', 'erro'],
            maxSelect: 1,
          },
          { name: 'disciplinas_json', type: 'json', maxSize: 100000 },
          { name: 'erro_msg', type: 'text', maxSize: 500 },
          ...autodates,
        ],
        indexes: [],
      }),
    )

    // ---------- sim_provas_ia (simulados gerados pela IA / personalizados) ----------
    app.save(
      new Collection({
        name: 'sim_provas_ia',
        ...ownerRules,
        fields: [
          ownerRel,
          { name: 'titulo', type: 'text', required: true, maxSize: 250 },
          { name: 'instituicao', type: 'text', maxSize: 160 },
          { name: 'banca', type: 'text', maxSize: 120 },
          { name: 'curso_cargo', type: 'text', maxSize: 200 },
          {
            name: 'modo',
            type: 'select',
            required: true,
            values: ['prova_anterior', 'base_provas_reais', 'inedito_ia', 'misto'],
            maxSelect: 1,
          },
          { name: 'config_json', type: 'json', required: true, maxSize: 60000 },
          { name: 'questoes_json', type: 'json', required: true, maxSize: 2000000 },
          { name: 'qtd_oficiais', type: 'number', onlyInt: true },
          { name: 'qtd_ia', type: 'number', onlyInt: true },
          { name: 'duracao_min', type: 'number', required: true, onlyInt: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['gerando', 'pronta', 'erro'],
            maxSelect: 1,
          },
          { name: 'erro_msg', type: 'text', maxSize: 500 },
          ...autodates,
        ],
        indexes: [],
      }),
    )

    // ---------- sim_tentativas_ia (tentativas das provas da central) ----------
    app.save(
      new Collection({
        name: 'sim_tentativas_ia',
        ...ownerRules,
        fields: [
          ownerRel,
          { name: 'prova_ia_id', type: 'text', required: true, maxSize: 40 },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['em_andamento', 'finalizada', 'abandonada'],
            maxSelect: 1,
          },
          { name: 'respostas_json', type: 'json', required: true, maxSize: 500000 },
          { name: 'marcadas_json', type: 'json', maxSize: 100000 },
          { name: 'tempo_usado_seg', type: 'number', onlyInt: true },
          { name: 'iniciado_em', type: 'date' },
          { name: 'finalizado_em', type: 'date' },
          { name: 'pct_acerto', type: 'number' },
          { name: 'resultado_json', type: 'json', maxSize: 200000 },
          { name: 'analise_ia', type: 'json', maxSize: 200000 },
          { name: 'favorita', type: 'bool' },
          ...autodates,
        ],
        indexes: ['CREATE INDEX idx_simtentia_prova ON sim_tentativas_ia (prova_ia_id)'],
      }),
    )

    // ---------- Seeds: bancas ----------
    const bancas = [
      ['Cebraspe', 'certo_errado', 'Concurso público — estilo Certo/Errado.'],
      ['FGV', 'misto', 'Fundação Getúlio Vargas — concursos e vestibulares.'],
      ['FCC', 'multipla_escolha', 'Fundação Carlos Chagas — concursos e vestibulares.'],
      ['Vunesp', 'multipla_escolha', 'Concursos e vestibulares do estado de SP.'],
      ['AOCP', 'multipla_escolha', 'Associação Open de Concursos.'],
      ['IBFC', 'multipla_escolha', 'Instituto Brasileiro de Formação e Capacitação.'],
      ['Consulplan', 'misto', 'Consulplan — concursos diversos.'],
      ['Quadrix', 'multipla_escolha', 'Quadrix — concursos diversos.'],
      ['Idecan', 'misto', 'Idecan — concursos diversos.'],
      ['Fundatec', 'multipla_escolha', 'Fundatec — concursos no sul do país.'],
      ['FUVEST', 'multipla_escolha', 'Vestibular da USP — 1ª e 2ª fases.'],
      ['UNICAMP', 'multipla_escolha', 'Vestibular da UNICAMP — com questões discursivas.'],
      ['ENEM', 'multipla_escolha', 'Exame Nacional do Ensino Médio — INEP.'],
    ]
    const bancaCol = app.findCollectionByNameOrId('sim_bancas')
    for (const [nome, estilo, descricao] of bancas) {
      try {
        if (app.countFilterRecords || true) {
          /* sempre tenta inserir se não existir */
        }
        try {
          app.findFirstRecordByFilter(bancaCol, `nome="${nome}"`)
        } catch (_) {
          const r = new Record(bancaCol)
          r.set('nome', nome)
          r.set('estilo', estilo)
          r.set('descricao', descricao)
          app.save(r)
        }
      } catch (_) {}
    }

    // ---------- Seeds: instituições (dados conservadores; campos não confirmados ficam "a confirmar") ----------
    const inst = [
      // [nome, sigla, categoria, tipo, bancas, descricao, cursos]
      [
        'Universidade de São Paulo',
        'USP',
        'universidade_publica',
        'publica',
        'FUVEST',
        'Vestibular via FUVEST, com 1ª fase (90 questões objetivas, aproximado — a confirmar) e 2ª fase discursiva. Confirme sempre o edital oficial do ano.',
        'Medicina, Direito, Engenharia, Computação',
      ],
      [
        'Universidade Estadual de Campinas',
        'UNICAMP',
        'universidade_publica',
        'publica',
        'UNICAMP',
        'Vestibular próprio da UNICAMP: 1ª fase objetivas e 2ª fase com questões discursivas. Detalhes por ano: a confirmar no edital oficial.',
        'Medicina, Engenharia, Letras',
      ],
      [
        'Universidade Estadual Paulista',
        'UNESP',
        'universidade_publica',
        'publica',
        'Vunesp',
        'Vestibular organizado pela Vunesp, com provas objetivas e (em parte dos cursos) discursivas. Detalhes: a confirmar.',
        'Medicina, Biológicas, Engenharia',
      ],
      [
        'PUC-SP',
        'PUC-SP',
        'faculdade_particular',
        'particular',
        'Fuvest',
        'Vestibular PUC-SP (processo próprio ou aproveitamento de outra prova — a confirmar por edição).',
        'Direito, Psicologia, Letras',
      ],
      [
        'PUC-Campinas',
        'PUC-Campinas',
        'faculdade_particular',
        'particular',
        'PUC-Campinas',
        'Vestibular próprio PUC-Campinas. Formato detalhado: a confirmar por edição.',
        'Medicina, Psicologia',
      ],
      [
        'UNIP',
        'UNIP',
        'faculdade_particular',
        'particular',
        'UNIP',
        'Vestibular UNIP — prova objetiva (formato variável por edição: a confirmar).',
        'Direito, Engenharia, Medicina',
      ],
      [
        'Universidade Presbiteriana Mackenzie',
        'Mackenzie',
        'faculdade_particular',
        'particular',
        'Mackenzie',
        'Vestibular Mackenzie — prova objetiva própria. Detalhes: a confirmar.',
        'Direito, Engenharia, Arquitetura',
      ],
      [
        'Fundação Getúlio Vargas',
        'FGV',
        'universidade_publica',
        'publica',
        'FGV',
        'Vestibular FGV — prova objetiva com estilo característico da banca FGV. Detalhes: a confirmar.',
        'Economia, Direito, Administração',
      ],
      [
        'Insper',
        'Insper',
        'faculdade_particular',
        'particular',
        'Insper',
        'Vestibular Insper — prova própria com questões de raciocínio e redação. Detalhes: a confirmar.',
        'Economia, Administração, Engenharia',
      ],
      [
        'Faculdade Israelita de Ciências da Saúde Albert Einstein',
        'Einstein',
        'faculdade_particular',
        'particular',
        'Einstein',
        'Vestibular de Medicina do Einstein — prova própria. Formato: a confirmar por edição.',
        'Medicina',
      ],
      [
        'Faculdade de Ciências Médicas da Santa Casa de São Paulo',
        'Santa Casa',
        'faculdade_particular',
        'particular',
        'Santa Casa',
        'Vestibular de Medicina da Santa Casa SP — prova própria. Formato: a confirmar por edição.',
        'Medicina',
      ],
      [
        'Faculdade São Camilo',
        'São Camilo',
        'faculdade_particular',
        'particular',
        'São Camilo',
        'Vestibular São Camilo — área da saúde. Formato: a confirmar por edição.',
        'Medicina, Enfermagem, Farmácia',
      ],
      [
        'Faculdade de Medicina de Marília',
        'FAMEMA',
        'faculdade_particular',
        'particular',
        'Vunesp',
        'Medicina FAMEMA — vestibular organizado via Vunesp. Detalhes: a confirmar.',
        'Medicina, Enfermagem',
      ],
      [
        'Faculdade de Medicina de São José do Rio Preto',
        'FAMERP',
        'universidade_publica',
        'publica',
        'Vunesp',
        'Medicina FAMERP — vestibular via Vunesp. Detalhes: a confirmar.',
        'Medicina, Enfermagem',
      ],
      [
        'Universidade Federal de São Paulo',
        'UNIFESP',
        'universidade_publica',
        'publica',
        'UNIFESP',
        'Vestibular UNIFESP (alguns cursos via ENEM/SISU). Formato próprio: a confirmar por edição.',
        'Medicina, Saúde, Humanidades',
      ],
      [
        'Universidade Federal do Rio de Janeiro',
        'UFRJ',
        'universidade_publica',
        'publica',
        'UFRJ',
        'Vestibular UFRJ — prova própria com questões discursivas. Detalhes: a confirmar.',
        'Medicina, Engenharia, Direito',
      ],
      [
        'Universidade Federal de Minas Gerais',
        'UFMG',
        'universidade_publica',
        'publica',
        'UFMG',
        'Vestibular UFMG — prova própria com objetivas e (alguns cursos) discursivas. Detalhes: a confirmar.',
        'Medicina, Direito, Engenharia',
      ],
      [
        'Universidade Federal do Rio Grande do Sul',
        'UFRGS',
        'universidade_publica',
        'publica',
        'UFRGS',
        'Vestibular UFRGS — prova objetiva própria. Detalhes: a confirmar.',
        'Medicina, Engenharia, Letras',
      ],
      [
        'Universidade Federal de Santa Catarina',
        'UFSC',
        'universidade_publica',
        'publica',
        'UFSC',
        'Vestibular UFSC — prova própria (formato variável por edição: a confirmar).',
        'Medicina, Direito, Engenharia',
      ],
      [
        'Universidade Estadual de Londrina',
        'UEL',
        'universidade_publica',
        'publica',
        'UEL',
        'Vestibular UEL — prova objetiva própria. Detalhes: a confirmar.',
        'Medicina, Direito, Letras',
      ],
      [
        'Universidade Estadual de Maringá',
        'UEM',
        'universidade_publica',
        'publica',
        'UEM',
        'Vestibular UEM — prova objetiva própria. Detalhes: a confirmar.',
        'Medicina, Engenharia, Biológicas',
      ],
      [
        'Universidade Federal do Paraná',
        'UFPR',
        'universidade_publica',
        'publica',
        'UFPR',
        'Vestibular UFPR — prova própria com objetivas e discursivas (a confirmar por edição).',
        'Medicina, Direito, Engenharia',
      ],
      [
        'ENEM / INEP',
        'ENEM',
        'vestibular',
        'publica',
        'ENEM',
        'Exame Nacional do Ensino Médio: dia 1 com Linguagens, Humanas e Redação; dia 2 com Natureza e Matemática (estrutura por edital vigente).',
        'Todos os cursos — acesso a universidades e SISU',
      ],
    ]
    const instCol = app.findCollectionByNameOrId('sim_instituicoes')
    for (const [nome, sigla, categoria, tipo, bancasStr, descricao, cursos] of inst) {
      try {
        app.findFirstRecordByFilter(instCol, `nome="${nome}"`)
      } catch (_) {
        const r = new Record(instCol)
        r.set('nome', nome)
        r.set('sigla', sigla)
        r.set('categoria', categoria)
        r.set('tipo', tipo)
        r.set('bancas', bancasStr)
        r.set('descricao', descricao)
        r.set('cursos', cursos)
        r.set('ativa', true)
        app.save(r)
      }
    }

    // ---------- Seeds: provas anteriores de referência (contagem conservadora) ----------
    const provas = [
      // [instituicao, banca, ano, fase, titulo, materias, total, duracao]
      [
        'ENEM / INEP',
        'ENEM',
        2023,
        'Dia 1',
        'ENEM 2023 — Dia 1 (Linguagens + Humanas + Redação)',
        'Linguagens, Ciências Humanas, Redação',
        90,
        330,
      ],
      [
        'ENEM / INEP',
        'ENEM',
        2023,
        'Dia 2',
        'ENEM 2023 — Dia 2 (Natureza + Matemática)',
        'Ciências da Natureza, Matemática',
        90,
        300,
      ],
      [
        'ENEM / INEP',
        'ENEM',
        2022,
        'Dia 1',
        'ENEM 2022 — Dia 1 (Linguagens + Humanas + Redação)',
        'Linguagens, Ciências Humanas, Redação',
        90,
        330,
      ],
      [
        'ENEM / INEP',
        'ENEM',
        2022,
        'Dia 2',
        'ENEM 2022 — Dia 2 (Natureza + Matemática)',
        'Ciências da Natureza, Matemática',
        90,
        300,
      ],
      [
        'Universidade de São Paulo',
        'FUVEST',
        2023,
        '1ª fase',
        'FUVEST 2023 — 1ª fase',
        'Linguagens, Humanas, Natureza, Matemática',
        90,
        300,
      ],
      [
        'Universidade de São Paulo',
        'FUVEST',
        2022,
        '1ª fase',
        'FUVEST 2022 — 1ª fase',
        'Linguagens, Humanas, Natureza, Matemática',
        90,
        300,
      ],
      [
        'Universidade Estadual de Campinas',
        'UNICAMP',
        2023,
        '1ª fase',
        'UNICAMP 2023 — 1ª fase',
        'Linguagens, Humanas, Natureza, Matemática',
        72,
        240,
      ],
      [
        'Universidade Estadual Paulista',
        'UNESP',
        2023,
        'Prova objetiva',
        'UNESP 2023 — provas de conhecimentos',
        'Linguagens, Humanas, Natureza, Matemática',
        90,
        300,
      ],
    ]
    const provasCol = app.findCollectionByNameOrId('sim_provas')
    for (const [instNome, banca, ano, fase, titulo, materias, total, duracao] of provas) {
      try {
        app.findFirstRecordByFilter(provasCol, `titulo="${titulo}"`)
      } catch (_) {
        const r = new Record(provasCol)
        r.set('instituicao', instNome)
        r.set('banca', banca)
        r.set('ano', ano)
        r.set('fase', fase)
        r.set('titulo', titulo)
        r.set('materias', materias)
        r.set('total_questoes', total)
        r.set('duracao_min', duracao)
        r.set('ativo', true)
        app.save(r)
      }
    }
  },
  (app) => {
    // Down: remove as coleções novas (as antigas ficam intactas)
    for (const nome of [
      'sim_tentativas_ia',
      'sim_provas_ia',
      'sim_editais',
      'sim_questoes_expandidas',
      'sim_provas',
      'sim_bancas',
      'sim_instituicoes',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
  },
)
