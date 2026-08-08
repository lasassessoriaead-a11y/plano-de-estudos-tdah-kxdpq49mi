migrate(
  (app) => {
    // Seed user luka2510@hotmail.com
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    let userRecord
    try {
      userRecord = app.findAuthRecordByEmail('_pb_users_auth_', 'luka2510@hotmail.com')
    } catch (_) {
      userRecord = new Record(usersCol)
      userRecord.setEmail('luka2510@hotmail.com')
      userRecord.setPassword('Skip@Pass')
      userRecord.setVerified(true)
      userRecord.set('name', 'Estudante TDAH')
      app.save(userRecord)
    }

    const userId = userRecord.id

    // Seed Materias
    const materiasCol = app.findCollectionByNameOrId('materias')
    const listMaterias = [
      { nome: 'Biologia', icone: 'Dna', cor: '#10B981', peso: 3, ordem: 1 },
      { nome: 'Química', icone: 'FlaskConical', cor: '#8B5CF6', peso: 3, ordem: 2 },
      { nome: 'Matemática', icone: 'Calculator', cor: '#3B82F6', peso: 3, ordem: 3 },
      { nome: 'Redação', icone: 'PenTool', cor: '#EF4444', peso: 3, ordem: 4 },
      { nome: 'Física', icone: 'Zap', cor: '#F97316', peso: 2, ordem: 5 },
      { nome: 'Português', icone: 'BookOpen', cor: '#EC4899', peso: 2, ordem: 6 },
      { nome: 'História', icone: 'Landmark', cor: '#14B8A6', peso: 1, ordem: 7 },
      { nome: 'Geografia', icone: 'Globe', cor: '#84CC16', peso: 1, ordem: 8 },
      { nome: 'Sociologia', icone: 'Users', cor: '#06B6D4', peso: 1, ordem: 9 },
      { nome: 'Filosofia', icone: 'Brain', cor: '#F59E0B', peso: 1, ordem: 10 },
    ]

    const materiaMap = {}

    for (const m of listMaterias) {
      try {
        const existing = app.findFirstRecordByData('materias', 'nome', m.nome)
        materiaMap[m.nome] = existing.id
      } catch (_) {
        const rec = new Record(materiasCol)
        rec.set('nome', m.nome)
        rec.set('icone', m.icone)
        rec.set('cor', m.cor)
        rec.set('peso', m.peso)
        rec.set('ordem', m.ordem)
        app.save(rec)
        materiaMap[m.nome] = rec.id
      }
    }

    // Seed Topicos
    const topicosCol = app.findCollectionByNameOrId('topicos')
    const listTopicos = [
      {
        titulo: 'Citologia: Membrana Plasmática',
        materia: 'Biologia',
        prioridade: 1,
        tipo: 'fluxograma',
        descricao: 'Estrutura, transporte passivo, ativo e especialização de membrana.',
      },
      {
        titulo: 'Genética: Leis de Mendel',
        materia: 'Biologia',
        prioridade: 1,
        tipo: 'fluxograma',
        descricao: 'Cruzamentos, probabilidade genética e heredogramas.',
      },
      {
        titulo: 'Estequiometria',
        materia: 'Química',
        prioridade: 1,
        tipo: 'fluxograma',
        descricao: 'Cálculos estequiométricos, rendimento e pureza.',
      },
      {
        titulo: 'Química Orgânica: Funções e Reações',
        materia: 'Química',
        prioridade: 1,
        tipo: 'fluxograma',
        descricao: 'Nomenclatura, isomeria e reações orgânicas.',
      },
      {
        titulo: 'Funções e Gráficos',
        materia: 'Matemática',
        prioridade: 1,
        tipo: 'pratica',
        descricao: 'Função afim, quadrática e interpretação de gráficos.',
      },
      {
        titulo: 'Análise Combinatória e Probabilidade',
        materia: 'Matemática',
        prioridade: 1,
        tipo: 'pratica',
        descricao: 'Arranjo, combinação, permutação e probabilidade condicional.',
      },
      {
        titulo: 'Estrutura Dissertativo-Argumentativa',
        materia: 'Redação',
        prioridade: 1,
        tipo: 'esqueleto',
        descricao: 'Esqueleto de tese, D1, D2 e proposta de intervenção completa.',
      },
      {
        titulo: 'Mecânica: Cinemática e Dinâmica',
        materia: 'Física',
        prioridade: 1,
        tipo: 'pratica',
        descricao: 'MRU, MRUV, Leis de Newton e conservação de energia.',
      },
    ]

    const topicoMap = {}

    for (const t of listTopicos) {
      try {
        const existing = app.findFirstRecordByData('topicos', 'titulo', t.titulo)
        topicoMap[t.titulo] = existing.id
      } catch (_) {
        const rec = new Record(topicosCol)
        rec.set('titulo', t.titulo)
        rec.set('materia_id', materiaMap[t.materia])
        rec.set('prioridade', t.prioridade)
        rec.set('tipo', t.tipo)
        rec.set('descricao', t.descricao)
        app.save(rec)
        topicoMap[t.titulo] = rec.id
      }
    }

    // Seed Pildes
    const pildesCol = app.findCollectionByNameOrId('pildes')
    const listPildes = [
      {
        titulo: 'Membrana Plasmática: Mosaico Fluido e Transporte',
        topico: 'Citologia: Membrana Plasmática',
        formato: 'esquema',
        duracao_teorica: 10,
        conteudo_teorico: `
<h3>🔬 Pílula de Conhecimento: Membrana Plasmática</h3>
<p><strong>Modelo do Mosaico Fluido (Singer & Nicolson):</strong> Bicamada de fosfolipídios com proteínas inseridas.</p>

<div class="p-3 my-2 bg-emerald-50 rounded-lg border border-emerald-200">
  <h4 class="font-bold text-emerald-800">1. Transporte Passivo (Sem gasto de ATP)</h4>
  <ul class="list-disc pl-5 text-sm space-y-1">
    <td><strong>Difusão Simples:</strong> Soluto passa do meio hipertônico para o hipotônico (ex: O2 e CO2).</td>
    <td><strong>Difusão Facilitada:</strong> Com ajuda de permeases/proteínas de canal (ex: Glicose).</td>
    <td><strong>Osmose:</strong> Passagem de SOLVENTE (água) do meio hipotônico para o hipertônico.</td>
  </ul>
</div>

<div class="p-3 my-2 bg-purple-50 rounded-lg border border-purple-200">
  <h4 class="font-bold text-purple-800">2. Transporte Ativo (Com gasto de ATP)</h4>
  <p class="text-sm"><strong>Bomba de Na+/K+:</strong> Coloca 3 Na+ para fora e 2 K+ para dentro contra o gradiente de concentração.</p>
</div>

<div class="p-3 my-2 bg-amber-50 rounded-lg border border-amber-200">
  <h4 class="font-bold text-amber-800">⚡ Dica de Ouro TDAH (Cai no ENEM)</h4>
  <p class="text-sm">Célula animal em meio hipotônico = Lise (estoura). Célula vegetal em meio hipotônico = Turgida (parede celular evita estouro!).</p>
</div>
      `,
      },
      {
        titulo: 'Estequiometria Passo a Passo Direto',
        topico: 'Estequiometria',
        formato: 'fluxograma',
        duracao_teorica: 10,
        conteudo_teorico: `
<h3>🧪 Pílula de Conhecimento: Estequiometria</h3>
<p>Esqueça os textos gigantes! Siga apenas o algoritmo das 3 linhas:</p>

<ol class="list-decimal pl-5 my-2 space-y-2 text-sm font-semibold">
  <li class="text-purple-700">Linha 1: Balancear a equação química (Ajuste os coeficientes).</li>
  <li class="text-purple-700">Linha 2: Escrever a proporção em Mols, Gramas ou Litros (22,4L na CNTP).</li>
  <li class="text-purple-700">Linha 3: Montar a Regra de Três com os dados da questão!</li>
</ol>

<div class="p-3 my-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs space-y-1">
  <p class="font-bold text-indigo-900">Atenção a Rendimento e Pureza:</p>
  <p>• Pureza: Aplique a porcentagem NO INÍCIO nos reagentes.</p>
  <p>• Rendimento: Aplique a porcentagem NO FINAL no produto obtido.</p>
</div>
      `,
      },
      {
        titulo: '1ª Lei de Mendel e Heredogramas',
        topico: 'Genética: Leis de Mendel',
        formato: 'mapa_mental',
        duracao_teorica: 10,
        conteudo_teorico: `
<h3>🧬 Pílula: 1ª Lei de Mendel (Segregação dos Fatores)</h3>

<div class="grid grid-cols-2 gap-2 my-2 text-xs">
  <div class="p-2 bg-green-50 border rounded">
    <p class="font-bold">Dominante (A)</p>
    <p>Manifesta-se em homozigose (AA) ou heterozigose (Aa).</p>
  </div>
  <div class="p-2 bg-red-50 border rounded">
    <p class="font-bold">Recessivo (a)</p>
    <p>Manifesta-se apenas em homozigose (aa).</p>
  </div>
</div>

<p class="text-sm font-bold text-emerald-700 mt-2">Truque do Heredograma:</p>
<p class="text-xs">Pais IGUAIS gerando filho DIFERENTE = Os pais são heterozigotos (Aa) e o filho é recessivo (aa)!</p>
      `,
      },
      {
        titulo: 'Esqueleto de Redação Nota 900+ em Medicina',
        topico: 'Estrutura Dissertativo-Argumentativa',
        formato: 'esqueleto_redacao',
        duracao_teorica: 10,
        conteudo_teorico: `
<h3>✍️ Pílula: Esqueleto Infalível de Redação</h3>

<div class="space-y-2 text-xs">
  <div class="p-2 bg-red-50 border border-red-200 rounded">
    <p class="font-bold text-red-800">1. Introdução</p>
    <p>Na obra [Repertório], aborda-se [Tema]. Paralelamente à realidade brasileira, percebe-se que [Problema]. Nesse contexto, cabe analisar não apenas [Causa 1], mas também [Causa 2].</p>
  </div>

  <div class="p-2 bg-amber-50 border border-amber-200 rounded">
    <p class="font-bold text-amber-800">2. Proposta de Intervenção (5 Elementos)</p>
    <p><strong>Agente:</strong> Ministério da Educação / Saúde<br>
    <strong>Ação:</strong> Deve implementar campanhas e oficinas...<br>
    <strong>Meio/Modo:</strong> Por meio de verbas direcionadas...<br>
    <strong>Detalhamento:</strong> Instituição responsável pela gestão nacional...<br>
    <strong>Efeito:</strong> A fim de mitigar o impasse e consolidar a cidadania.</p>
  </div>
</div>
      `,
      },
    ]

    const pildeMap = {}

    for (const p of listPildes) {
      try {
        const existing = app.findFirstRecordByData('pildes', 'titulo', p.titulo)
        pildeMap[p.titulo] = existing.id
      } catch (_) {
        const rec = new Record(pildesCol)
        rec.set('titulo', p.titulo)
        rec.set('topico_id', topicoMap[p.topico])
        rec.set('formato', p.formato)
        rec.set('duracao_teorica', p.duracao_teorica)
        rec.set('conteudo_teorico', p.conteudo_teorico)
        app.save(rec)
        pildeMap[p.titulo] = rec.id
      }
    }

    // Seed Missoes do Dia (hoje)
    const missoesCol = app.findCollectionByNameOrId('missoes')
    const hoje = new Date().toISOString().split('T')[0]

    const listMissoes = [
      {
        titulo: 'Citologia: Membrana Plasmática',
        pilde: 'Membrana Plasmática: Mosaico Fluido e Transporte',
        ordem: 1,
      },
      {
        titulo: 'Cálculos de Estequiometria',
        pilde: 'Estequiometria Passo a Passo Direto',
        ordem: 2,
      },
      { titulo: 'Genética: 1ª Lei de Mendel', pilde: '1ª Lei de Mendel e Heredogramas', ordem: 3 },
      {
        titulo: 'Esqueleto de Redação nota 900+',
        pilde: 'Esqueleto de Redação Nota 900+ em Medicina',
        ordem: 4,
      },
    ]

    for (const m of listMissoes) {
      try {
        const existing = app.findFirstRecordByData('missoes', 'titulo', m.titulo)
      } catch (_) {
        const rec = new Record(missoesCol)
        rec.set('usuario_id', userId)
        rec.set('data', hoje)
        rec.set('titulo', m.titulo)
        rec.set('pildes_id', pildeMap[m.pilde])
        rec.set('ordem', m.ordem)
        rec.set('status', 'pendente')
        app.save(rec)
      }
    }

    // Seed Questoes
    const questoesCol = app.findCollectionByNameOrId('questoes')
    const listQuestoes = [
      {
        enunciado:
          '(ENEM) A bomba de sódio-potássio é um exemplo de transporte ativo transmembrana. Sobre esse processo, é correto afirmar que:',
        alternativas: JSON.stringify([
          'Ocorre a favor do gradiente de concentração, sem consumo de ATP.',
          'Muda a forma da proteína para transportar 3 íons Na+ para fora e 2 K+ para dentro com gasto de ATP.',
          'Consiste na passagem livre de água do meio hipotônico para o hipertônico.',
          'É um tipo de difusão facilitada promovida por permeases.',
        ]),
        gabarito: 1,
        explicacao:
          'A bomba de Na+/K+ consome ATP para transportar 3 Na+ para fora e 2 K+ para dentro contra os gradientes de concentração.',
        materia: 'Biologia',
        pilde: 'Membrana Plasmática: Mosaico Fluido e Transporte',
        status: 'errou',
        revisao_agendada: hoje,
      },
      {
        enunciado:
          '(FUVEST) Quantos gramas de água (H2O) são produzidos na combustão completa de 1 mol de gás metano (CH4)? (Massas molares: C=12, H=1, O=16)',
        alternativas: JSON.stringify(['18 g', '36 g', '54 g', '72 g']),
        gabarito: 1,
        explicacao:
          'CH4 + 2 O2 -> CO2 + 2 H2O. 1 mol de CH4 produz 2 mols de H2O. Como a massa molar de H2O = 18 g/mol, 2 x 18 = 36 g.',
        materia: 'Química',
        pilde: 'Estequiometria Passo a Passo Direto',
        status: 'errou',
        revisao_agendada: hoje,
      },
      {
        enunciado:
          'Um casal normal gerou uma criança afetada por albinismo (doença autossômica recessiva). Qual a probabilidade do próximo filho ser normal?',
        alternativas: JSON.stringify(['25%', '50%', '75%', '100%']),
        gabarito: 2,
        explicacao:
          'Como o filho é aa (albino), ambos os pais são heterozigotos (Aa). O cruzamento Aa x Aa gera 1/4 AA, 2/4 Aa (normais = 75%) e 1/4 aa (albino = 25%).',
        materia: 'Biologia',
        pilde: '1ª Lei de Mendel e Heredogramas',
        status: 'pendente',
        revisao_agendada: null,
      },
    ]

    for (const q of listQuestoes) {
      try {
        const rec = new Record(questoesCol)
        rec.set('usuario_id', userId)
        rec.set('enunciado', q.enunciado)
        rec.set('alternativas', q.alternativas)
        rec.set('gabarito', q.gabarito)
        rec.set('explicacao', q.explicacao)
        rec.set('materia_id', materiaMap[q.materia])
        rec.set('pildes_id', pildeMap[q.pilde])
        rec.set('status', q.status)
        if (q.revisao_agendada) {
          rec.set('revisao_agendada', q.revisao_agendada)
        }
        app.save(rec)
      } catch (_) {}
    }
  },
  (app) => {},
)
