migrate(
  (app) => {
    const userRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com')
    const userId = userRecord.id

    const biologiaId = app.findFirstRecordByData('materias', 'nome', 'Biologia').id
    const quimicaId = app.findFirstRecordByData('materias', 'nome', 'Química').id
    const redacaoId = app.findFirstRecordByData('materias', 'nome', 'Redação').id

    var p1 = app.findFirstRecordByData(
      'pildes',
      'titulo',
      'Membrana Plasmática: Mosaico Fluido e Transporte',
    )
    var p2 = app.findFirstRecordByData('pildes', 'titulo', 'Estequiometria Passo a Passo Direto')
    var p3 = app.findFirstRecordByData('pildes', 'titulo', '1ª Lei de Mendel e Heredogramas')
    var p4 = app.findFirstRecordByData(
      'pildes',
      'titulo',
      'Esqueleto de Redação Nota 900+ em Medicina',
    )

    p1.set(
      'conteudo_teorico',
      '<h3>Membrana Plasmática</h3>\n<p>A membrana plasmática é a capa da célula. Ela protege e controla o que entra e sai.</p>\n<h4>Como é feita?</h4>\n<ul>\n<li><strong>Fosfolipídios:</strong> formam duas camadas. Cabeça gosta de água, cauda não gosta.</li>\n<li><strong>Proteínas:</strong> ficam dentro da camada. Servem de canal e receptor.</li>\n<li><strong>Colesterol:</strong> dá firmeza à membrana.</li>\n<li><strong>Glicocálix:</strong> açúcares na parte de fora. É a identidade da célula.</li>\n</ul>\n<h4>Transporte Sem Energia (Passivo)</h4>\n<p>Vai do lugar com mais para o lugar com menos. É como descer uma ladeira.</p>\n<ul>\n<li><strong>Difusão simples:</strong> coisas pequenas (O₂, CO₂) passam direto.</li>\n<li><strong>Difusão facilitada:</strong> coisas maiores (glicose) usam proteínas de canal.</li>\n<li><strong>Osmose:</strong> só a água passa. Vai do lado menos concentrado para o mais concentrado.</li>\n</ul>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Dica de Ouro (ENEM)</p><p class="text-sm">Célula animal em meio hipotônico = estoura (lise). Célula vegetal = fica túrgida (não estoura por causa da parede).</p></div>\n<h4>Transporte Com Energia (Ativo)</h4>\n<p>Vai contra o fluxo. É como subir uma ladeira: gasta energia (ATP).</p>\n<ul>\n<li><strong>Bomba de Na⁺/K⁺:</strong> tira 3 sódios e coloca 2 potássios. Gasta ATP.</li>\n<li><strong>Endocitose:</strong> a célula engloba coisas grandes de fora.</li>\n<li><strong>Exocitose:</strong> a célula joga coisas para fora (ex: hormônios).</li>\n</ul>\n<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"><p class="font-bold text-emerald-900">Resumo Rápido</p><p class="text-sm">Passivo = sem energia, a favor do fluxo. Ativo = com ATP, contra o fluxo. Osmose = só água.</p></div>',
    )
    app.save(p1)

    p2.set(
      'conteudo_teorico',
      '<h3>Estequiometria: Contas sem Medo</h3>\n<p>Estequiometria é calcular as quantidades numa reação química. São três passos simples.</p>\n<h4>Passo 1: Balancear</h4>\n<p>Coloque números na frente para ter a mesma quantidade de átomos nos dois lados.</p>\n<p>Exemplo: <strong>CH₄ + 2 O₂ → CO₂ + 2 H₂O</strong></p>\n<h4>Passo 2: Proporção</h4>\n<p>Escreva os números e as massas embaixo de cada substância.</p>\n<ul>\n<li>1 mol de CH₄ (16 g) produz 2 mols de H₂O (36 g).</li>\n<li>1 mol de gás = 22,4 L nas CNTP.</li>\n</ul>\n<h4>Passo 3: Regra de Três</h4>\n<p>Compare o que você tem com o que quer descobrir.</p>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Atenção: Pureza e Rendimento</p><p class="text-sm"><strong>Pureza:</strong> aplique no INÍCIO. Se o minério tem 80%, use só 80% da massa.</p><p class="text-sm"><strong>Rendimento:</strong> aplique no FINAL. Se é 90%, o resultado é 90% do calculado.</p></div>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Reagente Limitante</p><p class="text-sm">É o que acaba primeiro. Ele decide a quantidade máxima de produto.</p></div>\n<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"><p class="font-bold text-emerald-900">Resumo Rápido</p><p class="text-sm">Balancear → Proporção → Regra de três. Pureza no início, rendimento no fim.</p></div>',
    )
    app.save(p2)

    p3.set(
      'conteudo_teorico',
      '<h3>1ª Lei de Mendel</h3>\n<p>Mendel descobriu como as características passam de pais para filhos. Cada característica vem em pares (genes).</p>\n<h4>Palavras Importantes</h4>\n<ul>\n<li><strong>Gene:</strong> pedaço de DNA que define uma característica.</li>\n<li><strong>Alelo:</strong> cada versão do gene (ex: A ou a).</li>\n<li><strong>Genótipo:</strong> a combinação (AA, Aa ou aa).</li>\n<li><strong>Fenótipo:</strong> o que aparece (A_ = dominante, aa = recessivo).</li>\n</ul>\n<h4>Dominante e Recessivo</h4>\n<ul>\n<li><strong>Dominante (A):</strong> aparece sempre. Presente em AA e Aa.</li>\n<li><strong>Recessivo (a):</strong> só aparece em aa. Fica escondido em Aa.</li>\n</ul>\n<h4>Cruzamento Padrão: Aa x Aa</h4>\n<p>Dois heterozigotos geram:</p>\n<ul>\n<li>25% AA (dominante puro)</li>\n<li>50% Aa (heterozigoto)</li>\n<li>25% aa (recessivo)</li>\n</ul>\n<p>Resultado: <strong>75% dominante</strong> e <strong>25% recessivo</strong> (3:1).</p>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Truque do Heredograma (ENEM)</p><p class="text-sm">Pais normais com filho doente recessivo = os dois pais são Aa. Sempre!</p></div>\n<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"><p class="font-bold text-emerald-900">Cruzamento-Teste</p><p class="text-sm">Cruze com aa. Se todos os filhos forem dominantes = é AA. Se aparecer recessivo = é Aa.</p></div>',
    )
    app.save(p3)

    p4.set(
      'conteudo_teorico',
      '<h3>Esqueleto de Redação Nota 900+</h3>\n<p>A redação do ENEM é dissertativo-argumentativa. Tem 4 ou 5 parágrafos. Cada um tem uma função.</p>\n<h4>1. Introdução (1 parágrafo)</h4>\n<p>Apresente o tema e sua opinião (tese). Use um repertório (livro, filme, dado).</p>\n<p>Modelo: Na obra <em>[Repertório]</em>, aborda-se <em>[tema]</em>. Na realidade brasileira, nota-se <em>[problema]</em>. É preciso analisar <em>[causa 1]</em> e <em>[causa 2]</em>.</p>\n<h4>2. Desenvolvimento (2 parágrafos)</h4>\n<p>Cada parágrafo fala de uma causa do problema. Use dados, exemplos ou conceitos.</p>\n<ul>\n<li><strong>D1:</strong> Primeira causa. Conecte com o repertório.</li>\n<li><strong>D2:</strong> Segunda causa ou consequência.</li>\n</ul>\n<h4>3. Proposta de Intervenção (1 parágrafo)</h4>\n<p>Precisa ter 5 coisas. Faltou uma = perde pontos.</p>\n<ul>\n<li><strong>Agente:</strong> Quem vai fazer?</li>\n<li><strong>Ação:</strong> O que vai ser feito?</li>\n<li><strong>Meio/Modo:</strong> Como?</li>\n<li><strong>Detalhamento:</strong> Detalhe a ação.</li>\n<li><strong>Efeito:</strong> Qual o resultado?</li>\n</ul>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Dica de Ouro (ENEM)</p><p class="text-sm">A proposta deve ser viável e detalhada. Evite coisas genéricas como "o governo deve fazer campanhas". Detalhe!</p></div>\n<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"><p class="font-bold text-emerald-900">Conectivos</p><p class="text-sm">Adição: além disso. Oposição: por outro lado. Conclusão: portanto.</p></div>',
    )
    app.save(p4)

    var pildeIds = [p1.id, p2.id, p3.id, p4.id]
    for (var i = 0; i < pildeIds.length; i++) {
      var existing = app.findRecordsByFilter(
        'questoes',
        'pildes_id="' + pildeIds[i] + '"',
        '-created',
        50,
        0,
      )
      for (var j = 0; j < existing.length; j++) {
        var alt = existing[j].get('alternativas')
        if (typeof alt === 'string') {
          try {
            existing[j].set('alternativas', JSON.parse(alt))
            app.save(existing[j])
          } catch (_) {}
        }
      }
    }

    var qCol = app.findCollectionByNameOrId('questoes')
    var newQs = [
      {
        enunciado:
          'A glicose entra na célula através de uma proteína de canal, sem gasto de ATP. Esse processo é chamado de:',
        alternativas: ['Difusão simples', 'Difusão facilitada', 'Transporte ativo', 'Endocitose'],
        gabarito: 1,
        explicacao:
          'A difusão facilitada usa proteínas de canal para substâncias maiores (como glicose) atravessarem a membrana, sem gastar energia.',
        materia_id: biologiaId,
        pildes_id: p1.id,
      },
      {
        enunciado: 'Qual é a função principal do glicocálix na membrana plasmática?',
        alternativas: [
          'Produzir energia para a célula',
          'Servir de identidade e reconhecimento celular',
          'Impedir a entrada de água',
          'Digestão de partículas',
        ],
        gabarito: 1,
        explicacao:
          'O glicocálix é uma camada de açúcares na parte externa da membrana. Funciona como a identidade da célula, permitindo reconhecimento.',
        materia_id: biologiaId,
        pildes_id: p1.id,
      },
      {
        enunciado:
          'Na bomba de sódio e potássio (Na⁺/K⁺), a cada ciclo, quantos íons de sódio saem da célula?',
        alternativas: ['1', '2', '3', '4'],
        gabarito: 2,
        explicacao:
          'A bomba de Na⁺/K⁺ expulsa 3 íons de sódio (Na⁺) e coloca 2 íons de potássio (K⁺) a cada ciclo, gastando ATP.',
        materia_id: biologiaId,
        pildes_id: p1.id,
      },
      {
        enunciado: 'A osmose é um tipo de transporte passivo que envolve exclusivamente:',
        alternativas: [
          'Íons de sódio',
          'Gases como O₂ e CO₂',
          'A molécula de água',
          'Proteínas grandes',
        ],
        gabarito: 2,
        explicacao:
          'A osmose é a passagem de água através da membrana, do lado menos concentrado para o mais concentrado, sem gasto de energia.',
        materia_id: biologiaId,
        pildes_id: p1.id,
      },
      {
        enunciado: 'Quantos mols existem em 80 g de NaOH? (Massa molar do NaOH = 40 g/mol)',
        alternativas: ['1 mol', '2 mols', '3 mols', '4 mols'],
        gabarito: 1,
        explicacao:
          'n = m / M = 80 / 40 = 2 mols. A fórmula é: número de mols = massa dividida pela massa molar.',
        materia_id: quimicaId,
        pildes_id: p2.id,
      },
      {
        enunciado: 'Qual o volume ocupado por 3 mols de um gás nas CNTP? (1 mol = 22,4 L)',
        alternativas: ['22,4 L', '44,8 L', '67,2 L', '89,6 L'],
        gabarito: 2,
        explicacao:
          'Volume = número de mols × volume molar = 3 × 22,4 = 67,2 L. Nas CNTP, 1 mol de gás sempre ocupa 22,4 L.',
        materia_id: quimicaId,
        pildes_id: p2.id,
      },
      {
        enunciado:
          'Uma reação deveria produzir 100 g de produto, mas só produziu 80 g. Qual o rendimento da reação?',
        alternativas: ['20%', '80%', '100%', '125%'],
        gabarito: 1,
        explicacao:
          'Rendimento = (massa obtida / massa teórica) × 100 = (80 / 100) × 100 = 80%. O rendimento é aplicado no final do cálculo.',
        materia_id: quimicaId,
        pildes_id: p2.id,
      },
      {
        enunciado:
          'Na reação N₂ + 3H₂ → 2NH₃, se temos 2 mols de N₂ e 3 mols de H₂, qual é o reagente limitante?',
        alternativas: [
          'N₂, pois sobra 1 mol',
          'H₂, pois 2 mols de N₂ precisariam de 6 mols de H₂',
          'Ambos se consomem totalmente',
          'Não há limitante',
        ],
        gabarito: 1,
        explicacao:
          'A proporção é 1:3. Para 2 mols de N₂, seriam necessários 6 mols de H₂. Como só há 3 mols, o H₂ é o limitante.',
        materia_id: quimicaId,
        pildes_id: p2.id,
      },
      {
        enunciado:
          'Em um cruzamento Aa x Aa, qual a probabilidade de nascer um descendente com fenótipo recessivo?',
        alternativas: ['25%', '50%', '75%', '100%'],
        gabarito: 0,
        explicacao:
          'O cruzamento Aa x Aa gera 25% AA, 50% Aa e 25% aa. O fenótipo recessivo (aa) tem 25% de probabilidade.',
        materia_id: biologiaId,
        pildes_id: p3.id,
      },
      {
        enunciado:
          'Dois pais heterozigotos (Aa) para uma doença recessiva querem saber a probabilidade de ter um filho doente. Qual a resposta?',
        alternativas: ['0%', '25%', '50%', '75%'],
        gabarito: 1,
        explicacao:
          'Aa x Aa gera 25% aa. Como a doença é recessiva, apenas os aa são doentes. A probabilidade é 25%.',
        materia_id: biologiaId,
        pildes_id: p3.id,
      },
      {
        enunciado: 'No cruzamento Aa x Aa, qual é a proporção genotípica encontrada?',
        alternativas: ['3:1', '1:2:1', '9:3:3:1', '1:1'],
        gabarito: 1,
        explicacao:
          'A proporção genotípica de Aa x Aa é 1 AA : 2 Aa : 1 aa, ou seja, 1:2:1. A proporção fenotípica é 3:1.',
        materia_id: biologiaId,
        pildes_id: p3.id,
      },
      {
        enunciado:
          'Se um indivíduo de fenótipo dominante é cruzado com um recessivo (aa) e nasce 50% de filhos recessivos, qual é o genótipo do indivíduo?',
        alternativas: ['AA', 'Aa', 'aa', 'Impossível determinar'],
        gabarito: 1,
        explicacao:
          'Se 50% dos filhos são recessivos, o indivíduo é heterozigoto (Aa). O cruzamento Aa x aa gera 50% Aa e 50% aa.',
        materia_id: biologiaId,
        pildes_id: p3.id,
      },
      {
        enunciado: 'Nos parágrafos de desenvolvimento de uma redação, o aluno deve:',
        alternativas: [
          'Apresentar a tese e o tema',
          'Desenvolver as causas do problema com argumentos',
          'Fazer a proposta de intervenção',
          'Listar apenas opiniões pessoais',
        ],
        gabarito: 1,
        explicacao:
          'Os parágrafos de desenvolvimento devem aprofundar as causas do problema usando argumentos, dados e exemplos. A tese fica na introdução e a proposta no final.',
        materia_id: redacaoId,
        pildes_id: p4.id,
      },
      {
        enunciado: 'A expressão "além disso" estabelece qual tipo de relação entre parágrafos?',
        alternativas: ['Oposição', 'Adição de informações', 'Conclusão', 'Causa e efeito'],
        gabarito: 1,
        explicacao:
          '"Além disso" é um conectivo de adição. Ele soma uma nova informação à que já foi apresentada, sem contradizê-la.',
        materia_id: redacaoId,
        pildes_id: p4.id,
      },
      {
        enunciado:
          'Qual dos seguintes é um argumento válido para uma redação dissertativo-argumentativa?',
        alternativas: [
          '"Eu acho que isso é ruim"',
          'Dados estatísticos do IBGE sobre o tema',
          '"Minha mãe disse que é errado"',
          'Uma piada sobre o assunto',
        ],
        gabarito: 1,
        explicacao:
          'Argumentos válidos incluem dados estatísticos, exemplos concretos, conceitos filosóficos ou citações de obras. Opiniões pessoais sem base não são argumentos válidos.',
        materia_id: redacaoId,
        pildes_id: p4.id,
      },
      {
        enunciado:
          'O que acontece se a proposta de intervenção não detalhar o "meio/modo" de execução?',
        alternativas: [
          'Nada, é opcional',
          'Perde pontos por falta de um dos 5 elementos',
          'A redação é anulada',
          'Ganha pontos por ser objetiva',
        ],
        gabarito: 1,
        explicacao:
          'A proposta de intervenção precisa de 5 elementos: agente, ação, meio/modo, detalhamento e efeito. Faltar um deles faz perder pontos.',
        materia_id: redacaoId,
        pildes_id: p4.id,
      },
    ]

    for (var k = 0; k < newQs.length; k++) {
      var nq = newQs[k]
      try {
        app.findFirstRecordByData('questoes', 'enunciado', nq.enunciado)
      } catch (_) {
        var rec = new Record(qCol)
        rec.set('usuario_id', userId)
        rec.set('enunciado', nq.enunciado)
        rec.set('alternativas', nq.alternativas)
        rec.set('gabarito', nq.gabarito)
        rec.set('explicacao', nq.explicacao)
        rec.set('materia_id', nq.materia_id)
        rec.set('pildes_id', nq.pildes_id)
        rec.set('status', 'pendente')
        app.save(rec)
      }
    }
  },
  (app) => {},
)
