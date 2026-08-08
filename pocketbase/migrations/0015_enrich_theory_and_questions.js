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
      '<h3>Membrana Plasmática: A Fronteira da Célula</h3>\n<p>A membrana plasmática é a capa que envolve e protege a célula. Ela controla tudo que entra e sai.</p>\n<h4>1. Estrutura — Modelo do Mosaico Fluido</h4>\n<p>Imagine a membrana como um sanduíche de gordura com proteínas incrustadas. Esse é o modelo do mosaico fluido, proposto por Singer e Nicolson.</p>\n<ul>\n<li><strong>Fosfolipídios:</strong> formam uma camada dupla (bicamada). A cabeça atrai água e a cauda a repudia.</li>\n<li><strong>Proteínas:</strong> mergulhadas na bicamada. Servem de canal e receptor.</li>\n<li><strong>Colesterol:</strong> dá estabilidade. Impede que a membrana fique mole.</li>\n<li><strong>Glicocálix:</strong> camada de açúcares. Funciona como identidade da célula.</li>\n</ul>\n<h4>2. Transporte Passivo — sem gastar ATP</h4>\n<p>O movimento vai do local com mais substância para o local com menos. É como descer uma ladeira.</p>\n<ul>\n<li><strong>Difusão simples:</strong> substâncias pequenas (O₂, CO₂) atravessam diretamente.</li>\n<li><strong>Difusão facilitada:</strong> substâncias maiores (glicose) usam proteínas de canal.</li>\n<li><strong>Osmose:</strong> passagem de água. Vai do lado menos concentrado para o mais concentrado.</li>\n</ul>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Dica de Ouro (ENEM)</p><p class="text-sm">Célula animal em meio hipotônico = lise (estoura). Célula vegetal = túrgida (parede celular impede o estouro).</p></div>\n<h4>3. Transporte Ativo — gasta ATP</h4>\n<p>O movimento é contra o fluxo. É como subir uma ladeira: gasta energia.</p>\n<ul>\n<li><strong>Bomba de Na⁺/K⁺:</strong> tira 3 sódios e coloca 2 potássios. Consome ATP.</li>\n<li><strong>Endocitose:</strong> a célula engloba partículas grandes de fora para dentro.</li>\n<li><strong>Exocitose:</strong> a célula libera substâncias de dentro para fora (ex: hormônios).</li>\n</ul>\n<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"><p class="font-bold text-emerald-900">Resumo Rápido</p><p class="text-sm">Passivo = sem energia, a favor do fluxo. Ativo = com ATP, contra o fluxo. Osmose = só água.</p></div>',
    )
    app.save(p1)

    p2.set(
      'conteudo_teorico',
      '<h3>Estequiometria: Cálculos sem Complicação</h3>\n<p>Estequiometria é o cálculo das quantidades de reagentes e produtos em uma reação química. Siga três passos simples.</p>\n<h4>Passo 1: Balancear a equação</h4>\n<p>Ajuste os coeficientes para que o número de átomos seja igual nos dois lados.</p>\n<p>Exemplo: <strong>CH₄ + 2 O₂ → CO₂ + 2 H₂O</strong></p>\n<h4>Passo 2: Montar a proporção</h4>\n<p>Escreva os coeficientes e as massas molares abaixo de cada substância.</p>\n<ul>\n<li>1 mol de CH₄ (16 g) produz 2 mols de H₂O (36 g).</li>\n<li>1 mol de gás = 22,4 L nas CNTP (Condições Normais de Temperatura e Pressão).</li>\n</ul>\n<h4>Passo 3: Regra de três</h4>\n<p>Relacione o que você tem com o que quer descobrir.</p>\n<div class="p-3 my-2 bg-indigo-50 rounded-lg border border-indigo-300"><p class="font-bold text-indigo-900">Atenção a Pureza e Rendimento</p><p class="text-sm"><strong>Pureza:</strong> aplique a porcentagem no INÍCIO sobre os reagentes. Se o minério tem 80% de pureza, use apenas 80% da massa.</p><p class="text-sm"><strong>Rendimento:</strong> aplique a porcentagem no FINAL sobre o produto. Se o rendimento é 90%, o resultado final é 90% do calculado.</p></div>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Reagente Limitante</p><p class="text-sm">É o reagente que acaba primeiro. Ele determina a quantidade máxima de produto. Compare a proporção disponível com a proporção da equação balanceada.</p></div>\n<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"><p class="font-bold text-emerald-900">Resumo Rápido</p><p class="text-sm">Balancear → Proporção → Regra de três. Pureza no início, rendimento no fim.</p></div>',
    )
    app.save(p2)

    p3.set(
      'conteudo_teorico',
      '<h3>1ª Lei de Mendel: Segregação dos Fatores</h3>\n<p>Mendel estudou ervilhas e descobriu como as características são herdados. Cada característica é controlada por pares de fatores (hoje chamados de genes).</p>\n<h4>Conceitos Essenciais</h4>\n<ul>\n<li><strong>Gene:</strong> trecho de DNA que determina uma característica.</li>\n<li><strong>Alelo:</strong> cada versão de um gene (ex: A para dominante, a para recessivo).</li>\n<li><strong>Genótipo:</strong> a combinação genética (AA, Aa ou aa).</li>\n<li><strong>Fenótipo:</strong> o que aparece fisicamente (apenas A_ ou aa).</li>\n</ul>\n<h4>Dominância e Recessividade</h4>\n<ul>\n<li><strong>Dominante (A):</strong> se manifesta sempre que presente. Aparece em AA e Aa.</li>\n<li><strong>Recessivo (a):</strong> só aparece em homozigose (aa). Fica escondido em Aa.</li>\n</ul>\n<h4>O Cruzamento Padrão: Aa x Aa</h4>\n<p>Dois heterozigotos cruzados geram:</p>\n<ul>\n<li>25% AA (dominante puro)</li>\n<li>50% Aa (heterozigoto)</li>\n<li>25% aa (recessivo)</li>\n</ul>\n<p>Resultado: <strong>75% fenótipo dominante</strong> e <strong>25% fenótipo recessivo</strong> (proporção 3:1).</p>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Truque do Heredograma (ENEM)</p><p class="text-sm">Pais normais que geram um filho afetado por doença recessiva = os dois pais são heterozigotos (Aa). Sempre!</p></div>\n<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"><p class="font-bold text-emerald-900">Cruzamento-Teste</p><p class="text-sm">Cruzar um indivíduo de fenótipo dominante com um homozigoto recessivo (aa). Se todos os filhos forem dominantes, o indivíduo é AA. Se aparecerem filhos recessivos, é Aa.</p></div>',
    )
    app.save(p3)

    p4.set(
      'conteudo_teorico',
      '<h3>Esqueleto de Redação Nota 900+</h3>\n<p>A redação do ENEM é dissertativo-argumentativa. Tem 4 a 5 parágrafos. Cada um tem uma função clara.</p>\n<h4>1. Introdução (1 parágrafo)</h4>\n<p>Apresente o tema e a tese (sua posição). Use um repertório sociocultural para contextualizar.</p>\n<p>Modelo: Na obra <em>[Repertório]</em>, aborda-se <em>[tema]</em>. Paralelamente à realidade brasileira, percebe-se que <em>[problema]</em>. Cabe analisar <em>[causa 1]</em> e também <em>[causa 2]</em>.</p>\n<h4>2. Desenvolvimento (2 parágrafos)</h4>\n<p>Cada parágrafo desenvolve uma causa do problema. Use argumentos com dados, exemplos ou conceitos.</p>\n<ul>\n<li><strong>D1:</strong> Primeira causa ou reflexão. Conecte com o repertório.</li>\n<li><strong>D2:</strong> Segunda causa ou consequência. Aprofunde a análise.</li>\n</ul>\n<h4>3. Proposta de Intervenção (1 parágrafo)</h4>\n<p>Deve ter 5 elementos obrigatórios. Faltou um = perde pontos.</p>\n<ul>\n<li><strong>Agente:</strong> Quem vai fazer? (ex: Ministério da Saúde)</li>\n<li><strong>Ação:</strong> O que vai ser feito? (ex: criar campanhas educativas)</li>\n<li><strong>Meio/Modo:</strong> Como? (ex: por meio de verbas federais)</li>\n<li><strong>Detalhamento:</strong> Detalhe a ação. (ex: com palestras nas escolas públicas)</li>\n<li><strong>Efeito:</strong> Qual o resultado esperado? (ex: para reduzir o problema)</li>\n</ul>\n<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-300"><p class="font-bold text-amber-900">Dica de Ouro (ENEM)</p><p class="text-sm">A proposta deve ser viável e detalhada. Evite soluções genéricas como "o governo deve fazer campanhas". Detalhe!</p></div>\n<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-300"><p class="font-bold text-emerald-900">Conectivos Essenciais</p><p class="text-sm">Adição: além disso, somado a isso. Oposição: por outro lado, contudo. Conclusão: portanto, diante do exposto.</p></div>',
    )
    app.save(p4)

    // Fix existing questions: convert stringified JSON alternativas to real arrays
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

    // Add new questions (4-5 per pilde)
    var qCol = app.findCollectionByNameOrId('questoes')
    var newQs = [
      // Pilde 1 - Membrana Plasmática (3 new, 1 existing = 4 total)
      {
        enunciado:
          'Uma célula vegetal é colocada em uma solução hipertônica (mais concentrada que o interior da célula). Qual fenômeno é esperado?',
        alternativas: [
          'Turgidez — a célula incha.',
          'Plasmólise — a célula perde água e murcha.',
          'Lise celular — a célula estoura.',
          'Nenhuma alteração ocorre.',
        ],
        gabarito: 1,
        explicacao:
          'Em meio hipertônico, a água sai da célula por osmose. A célula vegetal sofre plasmólise: o citoplasma se contrai e se afasta da parede celular.',
        materia_id: biologiaId,
        pildes_id: p1.id,
      },
      {
        enunciado: 'Qual dos seguintes processos representa um exemplo de difusão simples?',
        alternativas: [
          'Entrada de glicose na célula através de permease.',
          'Bomba de sódio e potássio.',
          'Passagem de oxigênio (O₂) através da membrana.',
          'Englobamento de uma bactéria por um macrófago.',
        ],
        gabarito: 2,
        explicacao:
          'A difusão simples ocorre quando substâncias pequenas e lipossolúveis (como O₂ e CO₂) atravessam a bicamada lipídica diretamente, sem ajuda de proteínas.',
        materia_id: biologiaId,
        pildes_id: p1.id,
      },
      {
        enunciado: 'A endocitose é um processo de transporte que:',
        alternativas: [
          'Ocorre a favor do gradiente de concentração sem gasto de ATP.',
          'Envolve o englobamento de partículas com gasto de energia.',
          'É exclusivo de células vegetais.',
          'Transporta apenas gases dissolvidos.',
        ],
        gabarito: 1,
        explicacao:
          'A endocitose é um tipo de transporte ativo. A célula engloba partículas grandes do exterior usando energia (ATP) e modificação da membrana.',
        materia_id: biologiaId,
        pildes_id: p1.id,
      },
      // Pilde 2 - Estequiometria (3 new, 1 existing = 4 total)
      {
        enunciado:
          'Na reação 2H₂ + O₂ → 2H₂O, se temos 4 mols de H₂ e 1 mol de O₂, qual é o reagente limitante?',
        alternativas: [
          'H₂, pois sobram 2 mols.',
          'O₂, pois 4 mols de H₂ precisariam de 2 mols de O₂.',
          'Ambos se consomem totalmente.',
          'Não há reagente limitante.',
        ],
        gabarito: 1,
        explicacao:
          'A proporção é 2:1. Para 4 mols de H₂, seriam necessários 2 mols de O₂. Como só há 1 mol de O₂, ele é o limitante.',
        materia_id: quimicaId,
        pildes_id: p2.id,
      },
      {
        enunciado:
          'Qual o volume de CO₂ (gás carbônico) produzido na combustão completa de 2 mols de CH₄? (CNTP: 1 mol de gás = 22,4 L)',
        alternativas: ['22,4 L', '44,8 L', '67,2 L', '89,6 L'],
        gabarito: 1,
        explicacao:
          'CH₄ + 2O₂ → CO₂ + 2H₂O. A proporção é 1:1 entre CH₄ e CO₂. Logo, 2 mols de CH₄ produzem 2 mols de CO₂. Volume = 2 × 22,4 = 44,8 L.',
        materia_id: quimicaId,
        pildes_id: p2.id,
      },
      {
        enunciado:
          'Um minério tem 80% de pureza de Fe₂O₃. Quantos gramas de minério são necessários para obter 160 g de Fe₂O₃ puro?',
        alternativas: ['128 g', '160 g', '200 g', '250 g'],
        gabarito: 2,
        explicacao:
          'Se 80% do minério é Fe₂O₃ puro, então: massa do minério = 160 / 0,80 = 200 g. A pureza é aplicada no início sobre o reagente.',
        materia_id: quimicaId,
        pildes_id: p2.id,
      },
      // Pilde 3 - Mendel (3 new, 1 existing = 4 total)
      {
        enunciado:
          'Em um cruzamento Aa x Aa, qual a probabilidade de nascer um descendente homozigoto dominante (AA)?',
        alternativas: ['25%', '50%', '75%', '100%'],
        gabarito: 0,
        explicacao:
          'O cruzamento Aa x Aa gera: 25% AA, 50% Aa, 25% aa. A probabilidade de homozigoto dominante (AA) é 25%.',
        materia_id: biologiaId,
        pildes_id: p3.id,
      },
      {
        enunciado:
          'Um indivíduo de fenótipo dominante é cruzado com um recessivo (aa) e gera apenas descendentes de fenótipo dominante. Qual o genótipo do indivíduo?',
        alternativas: [
          'Aa (heterozigoto)',
          'aa (homozigoto recessivo)',
          'AA (homozigoto dominante)',
          'Impossível determinar',
        ],
        gabarito: 2,
        explicacao:
          'Se o indivíduo fosse Aa, o cruzamento com aa geraria 50% de recessivos. Como todos os filhos são dominantes, o indivíduo é AA.',
        materia_id: biologiaId,
        pildes_id: p3.id,
      },
      {
        enunciado:
          'O cruzamento-teste consiste em cruzar um indivíduo de fenótipo dominante com um indivíduo:',
        alternativas: [
          'Homozigoto dominante (AA)',
          'Heterozigoto (Aa)',
          'Homozigoto recessivo (aa)',
          'Da geração F1',
        ],
        gabarito: 2,
        explicacao:
          'O cruzamento-teste usa um indivíduo homozigoto recessivo (aa). Se todos os descendentes forem dominantes, o indivíduo testado é AA. Se aparecerem recessivos, é Aa.',
        materia_id: biologiaId,
        pildes_id: p3.id,
      },
      // Pilde 4 - Redação (4 new, 0 existing = 4 total)
      {
        enunciado:
          'Em uma redação dissertativo-argumentativa, o parágrafo de introdução deve apresentar:',
        alternativas: [
          'A proposta de intervenção detalhada.',
          'A tese e uma contextualização do tema.',
          'A conclusão e o fecho do texto.',
          'Apenas dados estatísticos sem análise.',
        ],
        gabarito: 1,
        explicacao:
          'A introdução deve contextualizar o tema e apresentar a tese (posição do autor). A proposta de intervenção fica para o último parágrafo.',
        materia_id: redacaoId,
        pildes_id: p4.id,
      },
      {
        enunciado: 'Qual elemento NÃO faz parte da proposta de intervenção do ENEM?',
        alternativas: [
          'Agente responsável pela ação.',
          'Meio ou modo de execução.',
          'Recursos linguísticos de coesão textual.',
          'Efeito esperado da intervenção.',
        ],
        gabarito: 2,
        explicacao:
          'Os 5 elementos da proposta são: Agente, Ação, Meio/Modo, Detalhamento e Efeito. A coesão textual é importante para a redação, mas não é um dos 5 elementos da proposta.',
        materia_id: redacaoId,
        pildes_id: p4.id,
      },
      {
        enunciado: 'O repertório sociocultural numa redação do ENEM deve ser:',
        alternativas: [
          'Qualquer opinião pessoal sem fundamentação.',
          'Uma citação aleatória de um filme de comédia.',
          'Uma obra, fato ou dado que dialogue diretamente com o tema.',
          'Obrigatoriamente de literatura brasileira clássica.',
        ],
        gabarito: 2,
        explicacao:
          'O repertório deve ser uma obra, fato histórico, dado estatístico ou conceito filosófico que se conecte diretamente com o tema, demonstrando leitura e reflexão.',
        materia_id: redacaoId,
        pildes_id: p4.id,
      },
      {
        enunciado:
          'A expressão "por outro lado" estabelece entre parágrafos qual tipo de relação lógica?',
        alternativas: [
          'Adição de informações.',
          'Oposição ou contraste entre ideias.',
          'Conclusão do raciocínio.',
          'Causa e efeito direto.',
        ],
        gabarito: 1,
        explicacao:
          'A expressão "por outro lado" introduz uma ideia contraposta à anterior, estabelecendo uma relação de oposição ou contraste entre os argumentos.',
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
