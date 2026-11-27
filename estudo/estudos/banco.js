/* Banco de questões do app Estudos.
   Cada livro tem capítulos; cada questão aponta para um capítulo.
   Tipos: 'escolha' (alternativas, a certa é o índice c) e 'aberta' (você escreve e compara com a resposta).
   O id de uma questão nunca muda: é ele que guarda o seu histórico de revisões. */
(function () {
  const LIVROS = [];
  const QUESTOES = [];
  let livroAtual = null;

  function livro(dados) { livroAtual = dados.id; LIVROS.push(dados); }
  function E(id, cap, p, op, c, r) { QUESTOES.push({ id: livroAtual + ':' + id, livro: livroAtual, cap, tipo: 'escolha', p, op, c, r }); }
  function A(id, cap, p, r) { QUESTOES.push({ id: livroAtual + ':' + id, livro: livroAtual, cap, tipo: 'aberta', p, r }); }

  /* ============================================================
     FILOSOFIA PARA LEIGOS
     ============================================================ */
  livro({
    id: 'filosofia-leigos',
    titulo: 'Filosofia Para Leigos',
    area: 'Filosofia',
    situacao: 'lendo',
    cor: '#ba745b',
    capitulos: [
      { n: 1, parte: 'I · O que é filosofia?', titulo: 'Do que trata a filosofia?' },
      { n: 2, parte: 'I · O que é filosofia?', titulo: 'Descobrindo por que a filosofia importa' },
      { n: 3, parte: 'I · O que é filosofia?', titulo: 'Tornando-se um pensador filosófico' },
      { n: 4, parte: 'II · A história da filosofia', titulo: 'Conhecendo as filosofias antigas' },
      { n: 5, parte: 'II · A história da filosofia', titulo: 'Da Idade das Trevas à atualidade' },
      { n: 6, parte: 'II · A história da filosofia', titulo: 'Uma olhada na filosofia oriental' },
      { n: 7, parte: 'II · A história da filosofia', titulo: 'Entendendo os "ismos"' },
      { n: 8, parte: 'III · O arroz com feijão da filosofia', titulo: 'Descobrindo os limites da lógica' },
      { n: 9, parte: 'III · O arroz com feijão da filosofia', titulo: 'Entendendo o conhecimento' },
      { n: 10, parte: 'IV · Explorando um pouco mais', titulo: 'Olhando a ética e a moralidade' }
    ]
  });

  /* ---------- Capítulo 1 ---------- */
  E('1a', 1, 'A palavra "filosofia" vem do grego e significa, ao pé da letra:',
    ['Amor à sabedoria', 'Estudo da alma', 'Ciência das causas', 'Arte de discutir'], 0,
    'Philo (amor, amizade) + sophia (sabedoria). A tradição atribui a Pitágoras o uso do termo: ele preferia ser chamado de amigo da sabedoria, não de sábio, porque a sabedoria plena seria só dos deuses.');
  E('1b', 1, 'Qual área da filosofia pergunta o que existe e qual é a natureza última da realidade (mente, matéria, tempo, Deus)?',
    ['Metafísica', 'Epistemologia', 'Ética', 'Estética'], 0,
    'Metafísica. O nome vem dos livros de Aristóteles organizados "depois da física" (meta ta physika), que tratavam do ser enquanto ser.');
  E('1c', 1, 'A pergunta "como sabemos o que sabemos, e o que conta como conhecimento?" pertence a qual área?',
    ['Lógica', 'Epistemologia', 'Metafísica', 'Filosofia política'], 1,
    'Epistemologia, de episteme (conhecimento). É a área do capítulo 9 do livro: justificação, crença, verdade, ceticismo.');
  E('1d', 1, 'Beleza, gosto e o que faz de algo uma obra de arte são temas de qual área?',
    ['Ética', 'Lógica', 'Estética', 'Ontologia'], 2,
    'Estética. O termo ganhou o sentido atual com Baumgarten, no século XVIII, mas Platão e Aristóteles já discutiam a arte (a Poética de Aristóteles é sobre a tragédia).');
  A('1e', 1, 'Qual é a diferença entre uma pergunta científica e uma pergunta filosófica? Dê um exemplo de cada.',
    'A pergunta científica se resolve com observação, medição e experimento ("a que temperatura a água ferve ao nível do mar?"). A filosófica trata de conceitos, fundamentos e pressupostos que os dados sozinhos não decidem ("o que é justiça?", "o que torna uma prova válida?", "a mente é o cérebro?"). Muitas vezes a ciência já pressupõe respostas filosóficas: que o mundo é regular, que a indução funciona.');
  E('1f', 1, 'Segundo a Apologia de Platão, o oráculo de Delfos disse que Sócrates era o mais sábio dos atenienses. Como Sócrates interpretou isso?',
    ['Ele sabia mais que todos sobre a natureza', 'Ele, ao menos, sabia que não sabia', 'Ele tinha recebido a sabedoria dos deuses', 'Ele vencia qualquer debate'], 1,
    'Sócrates foi conversar com políticos, poetas e artesãos que se julgavam sábios e concluiu que a vantagem dele era reconhecer a própria ignorância. Daí a fórmula popular "só sei que nada sei".');
  E('1g', 1, '"Uma vida sem exame não vale a pena ser vivida." Quem disse, e em que situação?',
    ['Aristóteles, na Ética a Nicômaco', 'Sócrates, no julgamento que o condenou à morte', 'Sêneca, numa carta a Lucílio', 'Descartes, nas Meditações'], 1,
    'Sócrates, na Apologia (o discurso de defesa registrado por Platão), em 399 a.C. Ele recusou parar de filosofar em troca da vida.');
  A('1h', 1, 'Descreva o método socrático. O que ele faz com a pessoa que está sendo questionada?',
    'Sócrates pede uma definição ("o que é coragem?"), aceita provisoriamente a resposta e faz perguntas até mostrar que ela leva a contradições ou deixa casos de fora (é o elenchus, a refutação). O interlocutor reconhece que não sabia o que achava que sabia e é levado a buscar uma definição melhor. Sócrates chamava isso de maiêutica, a arte da parteira: ajudar o outro a dar à luz as próprias ideias.');

  /* ---------- Capítulo 2 ---------- */
  A('2a', 2, 'Se a filosofia raramente chega a respostas definitivas, para que ela serve? Dê pelo menos duas razões.',
    'Ela treina o pensamento crítico (examinar argumentos, achar falácias, separar o que se sabe do que se supõe); esclarece conceitos que usamos sem pensar (liberdade, justiça, causa); expõe os pressupostos de decisões políticas, morais e científicas; e foi a origem de várias ciências, que se separaram dela quando suas perguntas passaram a ter método empírico próprio (física, psicologia, economia).');
  E('2b', 2, 'Até o século XVIII, o que hoje chamamos de física era conhecido como:',
    ['Filosofia natural', 'Metafísica aplicada', 'Mecânica sagrada', 'Lógica experimental'], 0,
    'Filosofia natural. A obra máxima de Newton (1687) se chama Philosophiae Naturalis Principia Mathematica, "Princípios Matemáticos da Filosofia Natural".');
  E('2c', 2, 'Em "Os Problemas da Filosofia" (1912), Bertrand Russell diz que o valor da filosofia está principalmente:',
    ['Nas respostas certas que ela fornece', 'Na própria incerteza, que amplia o pensamento e nos livra da tirania do costume', 'Na preparação para a teologia', 'Em servir de base para a matemática'], 1,
    'Para Russell, quem nunca filosofou vive preso aos preconceitos do senso comum e da época. As perguntas filosóficas alargam o que achamos possível, mesmo sem resposta final.');
  E('2d', 2, 'Quem costuma ser chamado de primeiro filósofo do Ocidente, por buscar uma explicação natural (a água) para a origem de tudo?',
    ['Pitágoras', 'Tales de Mileto', 'Homero', 'Sócrates'], 1,
    'Tales de Mileto, por volta de 600 a.C. O passo decisivo foi trocar a explicação pelos mitos (deuses) por um princípio natural, a arché.');
  A('2e', 2, 'Escolha um debate atual (pena de morte, aborto, redes sociais, cotas) e mostre um pressuposto filosófico escondido nele.',
    'Exemplo: no debate sobre a pena de morte, quem defende "porque reduz crimes" pressupõe uma teoria consequencialista da punição (punir para dissuadir); quem defende "porque o criminoso merece" pressupõe uma teoria retributiva (punir porque é justo, independente do efeito). Muitas brigas não são sobre os dados, e sim sobre qual desses princípios vale.');

  /* ---------- Capítulo 3 ---------- */
  E('3a', 3, '"Não dá para levar a sério o argumento dele sobre economia; ele foi reprovado na faculdade." Que falácia é essa?',
    ['Espantalho', 'Ad hominem', 'Apelo à autoridade', 'Falso dilema'], 1,
    'Ad hominem: ataca a pessoa em vez do argumento. O argumento pode ser bom ou ruim independentemente de quem o faz.');
  E('3b', 3, 'Alguém defende reduzir o orçamento militar e o adversário responde: "Ele quer deixar o país indefeso." Que falácia é essa?',
    ['Espantalho', 'Petição de princípio', 'Ladeira escorregadia', 'Ad hominem'], 0,
    'Espantalho (homem de palha): deforma a posição do outro numa versão mais fraca ou extrema, fácil de derrubar.');
  E('3c', 3, '"A Bíblia é verdadeira porque é a palavra de Deus, e sabemos que é a palavra de Deus porque a Bíblia diz." Qual é o defeito?',
    ['Falso dilema', 'Petição de princípio (raciocínio circular)', 'Generalização apressada', 'Apelo à emoção'], 1,
    'Petição de princípio: a conclusão já está escondida numa das premissas. O argumento pressupõe o que queria provar.');
  E('3d', 3, '"Ou você apoia totalmente o governo, ou é inimigo do país." Que falácia é essa?',
    ['Falso dilema', 'Espantalho', 'Apelo à tradição', 'Post hoc'], 0,
    'Falso dilema (falsa dicotomia): apresenta só duas opções quando existem outras.');
  A('3e', 3, 'Qual é a diferença entre um argumento válido e um argumento sólido? Dê um exemplo de argumento válido com conclusão falsa.',
    'Válido: se as premissas forem verdadeiras, a conclusão é necessariamente verdadeira (é uma questão de forma). Sólido: válido e com premissas de fato verdadeiras. Exemplo válido mas não sólido: "Todos os peixes voam; o tubarão é peixe; logo o tubarão voa." A forma está certa, a primeira premissa é falsa.');
  E('3f', 3, 'O navio de Teseu tem todas as tábuas trocadas, uma a uma, ao longo dos anos. Ainda é o mesmo navio? Esse experimento mental trata de:',
    ['Identidade e persistência ao longo do tempo', 'Livre-arbítrio', 'Existência de Deus', 'Origem do conhecimento'], 0,
    'Identidade: o que faz algo continuar sendo a mesma coisa apesar da mudança. A pergunta vale para pessoas também (todas as células do corpo se renovam). Hobbes acrescentou: e se alguém montasse outro navio com as tábuas velhas?');
  A('3g', 3, 'O que é o "princípio da caridade" ao discutir com alguém, e por que ele faz de você um pensador melhor?',
    'É interpretar o argumento do outro na sua versão mais forte e razoável antes de criticá-lo (o oposto do espantalho). Se você derruba a melhor versão, a crítica vale; se derruba só uma versão fraca, não provou nada. E às vezes descobre que o outro tinha razão em parte.');
  E('3h', 3, 'Para que servem os experimentos mentais na filosofia?',
    ['Substituir os experimentos de laboratório', 'Isolar uma questão conceitual num caso imaginário e testar nossas intuições', 'Provar empiricamente uma teoria', 'Decorar argumentos clássicos'], 1,
    'Eles criam situações controladas na imaginação (o gênio maligno de Descartes, o bonde, o cérebro numa cuba) para ver o que nossos conceitos implicam e onde nossas intuições entram em choque.');

  /* ---------- Capítulo 4 ---------- */
  E('4a', 4, '"Não se pode entrar duas vezes no mesmo rio." Quem disse e qual é a ideia?',
    ['Parmênides: a mudança é ilusão', 'Heráclito: tudo está em fluxo, em constante mudança', 'Tales: tudo vem da água', 'Demócrito: tudo é feito de átomos'], 1,
    'Heráclito de Éfeso (c. 500 a.C.). A realidade é fluxo e tensão de opostos, e o fogo é sua imagem. Também se atribui a ele o panta rhei, "tudo flui".');
  E('4b', 4, 'Qual pré-socrático defendeu o oposto de Heráclito: que a mudança e a multiplicidade são ilusões, porque "o ser é e o não-ser não é"?',
    ['Pitágoras', 'Anaximandro', 'Parmênides', 'Empédocles'], 2,
    'Parmênides de Eleia. Para ele, a razão mostra que o ser é uno, imóvel e eterno; os sentidos enganam. Seu discípulo Zenão criou paradoxos (Aquiles e a tartaruga) para defender essa tese.');
  E('4c', 4, 'Leucipo e Demócrito afirmavam que tudo é composto de:',
    ['Quatro elementos: terra, água, ar e fogo', 'Átomos indivisíveis movendo-se no vazio', 'Números', 'Formas eternas'], 1,
    'Atomismo: partículas indivisíveis (a-tomos, "não cortável") e vazio. Mais tarde Epicuro e Lucrécio retomaram essa física.');
  E('4d', 4, '"O homem é a medida de todas as coisas." A frase é de Protágoras, um sofista. O que ela expressa?',
    ['Relativismo: a verdade depende de quem percebe ou julga', 'Humanismo cristão', 'Que só o homem tem alma', 'Que a matemática mede o mundo'], 0,
    'É a fórmula clássica do relativismo. Os sofistas eram professores pagos de retórica; Platão os atacou por ensinarem a vencer debates, não a buscar a verdade.');
  A('4e', 4, 'Conte a alegoria da caverna e explique o que cada elemento representa.',
    'Prisioneiros acorrentados desde sempre veem só sombras projetadas na parede por objetos levados diante de uma fogueira, e acham que as sombras são a realidade. Um deles é libertado, sobe com dor até a saída e, ofuscado, aos poucos vê as coisas reais e por fim o Sol. Ao voltar para libertar os outros, é ridicularizado e ameaçado. A caverna é o mundo sensível; as sombras, as opiniões; a saída, a educação filosófica; o mundo de fora, as Formas; o Sol, a Forma do Bem. O retorno lembra a morte de Sócrates. Está no livro VII da República.');
  E('4f', 4, 'Para Platão, a Forma (ou Ideia) de "círculo":',
    ['Só existe na mente de quem pensa', 'É a média dos círculos que já vimos', 'É perfeita, eterna e imutável, e os círculos desenhados apenas participam dela', 'É uma convenção da linguagem'], 2,
    'As Formas existem num mundo inteligível, acessível pela razão. As coisas sensíveis são cópias imperfeitas. Nenhum círculo desenhado é perfeitamente redondo, e mesmo assim sabemos o que é um círculo perfeito.');
  A('4g', 4, 'Qual a diferença principal entre Platão e Aristóteles sobre onde está a "forma" das coisas e de onde vem o conhecimento?',
    'Para Platão, as Formas estão separadas das coisas, num mundo inteligível, e conhecer é lembrar ou contemplar pela razão. Para Aristóteles, a forma está nas próprias coisas, unida à matéria (hilemorfismo), e o conhecimento começa pela experiência sensível, da qual a razão abstrai o universal. No afresco Escola de Atenas, de Rafael, Platão aponta para o céu e Aristóteles estende a mão para a terra.');
  E('4h', 4, 'Das quatro causas de Aristóteles, qual responde à pergunta "para quê?" (a finalidade de algo)?',
    ['Causa material', 'Causa formal', 'Causa eficiente', 'Causa final'], 3,
    'Numa estátua: material = o mármore; formal = a forma que ela tem; eficiente = o escultor; final = o propósito (homenagear alguém). A causa final é o telos.');
  E('4i', 4, 'Para Aristóteles, a coragem é uma virtude porque fica:',
    ['No extremo oposto ao medo', 'No meio-termo entre a covardia e a temeridade', 'Acima das emoções', 'De acordo com a lei da cidade'], 1,
    'A virtude é um meio-termo entre dois vícios, um por falta e outro por excesso, e se forma pelo hábito. O objetivo da vida é a eudaimonia, a vida plena e bem realizada.');
  E('4j', 4, 'Qual escola ensinava a separar o que depende de nós (juízos, escolhas) do que não depende (corpo, reputação, fortuna), buscando a serenidade?',
    ['Epicurismo', 'Estoicismo', 'Cinismo', 'Ceticismo'], 1,
    'O estoicismo, fundado por Zenão de Cítio. Seus nomes mais lidos hoje são Sêneca, Epicteto (o Manual começa justamente com essa distinção) e Marco Aurélio.');
  E('4k', 4, 'Para Epicuro, o prazer que é o bem supremo é sobretudo:',
    ['O banquete e a festa', 'A ausência de dor no corpo e de perturbação na alma (ataraxia)', 'O poder político', 'O êxtase religioso'], 1,
    'Epicuro vivia de forma simples, no Jardim, com amigos. Dizia que a morte não deve assustar: "quando ela está, nós não estamos". O sentido de "epicurista" como glutão é uma deturpação.');

  /* ---------- Capítulo 5 ---------- */
  E('5a', 5, 'Para Santo Agostinho, se Deus é bom e criou tudo, de onde vem o mal?',
    ['De um deus mau rival', 'O mal não é uma substância, é ausência ou privação do bem, ligada ao livre-arbítrio', 'Da matéria, que é má em si', 'O mal é ilusão dos sentidos'], 1,
    'Agostinho foi maniqueísta na juventude (duas forças, bem e mal) e abandonou isso. O mal seria como a escuridão, que é falta de luz. Obras centrais: Confissões e A Cidade de Deus.');
  E('5b', 5, 'Qual era o grande projeto de Tomás de Aquino (século XIII)?',
    ['Provar que a razão é inútil para a fé', 'Conciliar a filosofia de Aristóteles com a teologia cristã', 'Substituir a Bíblia pela ciência', 'Recuperar o atomismo'], 1,
    'Na Suma Teológica, ele apresenta as "cinco vias", argumentos racionais para a existência de Deus (primeiro motor, causa primeira, ser necessário, graus de perfeição, finalidade), quase todos inspirados em Aristóteles.');
  E('5c', 5, 'A "navalha de Ockham" recomenda:',
    ['Duvidar de tudo', 'Não multiplicar entidades além do necessário: entre explicações, prefira a mais simples que dê conta', 'Cortar as emoções do raciocínio', 'Separar fé e razão à força'], 1,
    'Guilherme de Ockham, frade franciscano do século XIV. A navalha não garante que o mais simples seja verdadeiro; é uma regra de economia nas explicações.');
  E('5d', 5, 'Por que Descartes imagina um "gênio maligno"?',
    ['Para provar que o diabo existe', 'Para levar a dúvida ao extremo e achar algo que resista até a ela', 'Para explicar os sonhos', 'Para criticar a Igreja'], 1,
    'É a dúvida metódica: se um ser poderoso me enganasse em tudo, até na matemática, o que restaria? Resta que, para ser enganado, eu preciso existir. Daí o cogito.');
  E('5e', 5, '"Penso, logo existo" é importante para Descartes porque:',
    ['É uma verdade da fé', 'É a primeira certeza indubitável, sobre a qual reconstruir o conhecimento', 'Prova que o corpo existe', 'Mostra que os sentidos são confiáveis'], 1,
    'Cogito, ergo sum (no Discurso do Método, 1637; nas Meditações aparece como "eu sou, eu existo"). É o ponto fixo de Arquimedes que ele procurava.');
  A('5f', 5, 'Explique a disputa entre racionalistas e empiristas e cite três nomes de cada lado.',
    'Racionalistas: a razão, por si, alcança verdades certas, e há ideias ou princípios que não vêm da experiência (Descartes, Espinosa, Leibniz). Empiristas: todo conhecimento vem da experiência sensível, a mente começa vazia (Locke, Berkeley, Hume). Kant tentou a síntese: o conhecimento começa com a experiência, mas nem todo ele deriva dela, porque a mente traz formas (espaço, tempo, categorias) que organizam o que os sentidos dão.');
  E('5g', 5, 'Locke comparou a mente ao nascer a:',
    ['Um espelho', 'Uma folha em branco (tabula rasa)', 'Uma biblioteca esquecida', 'Uma máquina'], 1,
    'No Ensaio sobre o Entendimento Humano (1689): todas as ideias vêm da sensação (experiência externa) ou da reflexão (a mente observando suas próprias operações).');
  E('5h', 5, 'Berkeley resumiu sua filosofia em "esse est percipi". O que significa?',
    ['Ser é ser percebido', 'Perceber é existir', 'O ser é eterno', 'Só a matéria existe'], 0,
    'Para Berkeley (idealismo imaterialista), objetos são coleções de percepções; não existe matéria independente da mente. O que garante que a árvore continua lá quando ninguém olha é a percepção de Deus.');
  E('5i', 5, 'Hume diz que nunca observamos a causa propriamente, só que um evento costuma seguir outro. Então a nossa ideia de causa vem:',
    ['Da razão pura', 'Do hábito ou costume de ver a conjunção constante', 'De Deus', 'Da matemática'], 1,
    'Daí o problema da indução: nada garante racionalmente que o futuro será como o passado. Kant disse que Hume o acordou do "sono dogmático".');
  E('5j', 5, 'A "revolução copernicana" de Kant consiste em:',
    ['Provar que a Terra gira em torno do Sol', 'Inverter a relação: em vez de a mente se regular pelos objetos, os objetos (como fenômenos) se regulam pelas formas da mente', 'Abandonar a metafísica de vez', 'Colocar Deus no centro do conhecimento'], 1,
    'Espaço e tempo são formas da sensibilidade, e as categorias (como causalidade) são do entendimento. Conhecemos as coisas como nos aparecem (fenômenos), não como são em si (númeno). Crítica da Razão Pura, 1781.');
  E('5k', 5, 'Hegel entende a história como:',
    ['Uma sucessão de acasos sem sentido', 'O desenvolvimento dialético do Espírito rumo à consciência da liberdade', 'O ciclo eterno das mesmas coisas', 'A luta entre o bem e o mal'], 1,
    'Cada posição gera sua contradição e é superada num nível mais alto que conserva algo das duas (Aufhebung). A fórmula "tese, antítese, síntese" é mais de Fichte e dos manuais do que do próprio Hegel.');
  E('5l', 5, '"Deus está morto" aparece em qual autor, e o que quer dizer?',
    ['Marx: a religião é ópio do povo', 'Nietzsche: a crença no Deus cristão já não sustenta os valores da cultura europeia, e isso abre o risco do niilismo', 'Sartre: o homem é Deus', 'Feuerbach: Deus nunca existiu'], 1,
    'Em A Gaia Ciência (1882), na fala do louco que procura Deus no mercado. Não é um grito de vitória: "nós o matamos", e agora é preciso criar valores novos.');
  E('5m', 5, '"Sobre aquilo de que não se pode falar, deve-se calar." De quem é a frase?',
    ['Heidegger', 'Wittgenstein, no Tractatus Logico-Philosophicus', 'Kierkegaard', 'Russell'], 1,
    'É a última proposição do Tractatus (1921). Para o jovem Wittgenstein, a linguagem só descreve fatos; ética, estética e o sentido da vida ficam fora do que pode ser dito, embora se "mostrem".');

  /* ---------- Capítulo 6 ---------- */
  E('6a', 6, 'Qual conceito é central na ética de Confúcio?',
    ['Wu wei (não ação)', 'Ren (benevolência, humanidade) cultivada pelo ritual e pelas relações', 'Nirvana', 'Ataraxia'], 1,
    'Ren é a virtude humana por excelência; li são os ritos e as normas de conduta; a piedade filial é a base das relações. Os ensinamentos estão nos Analectos, reunidos pelos discípulos.');
  E('6b', 6, 'A versão de Confúcio da "regra de ouro" é:',
    ['Ame o próximo como a ti mesmo', 'Não faça aos outros o que não quer que façam a você', 'Faça o que quiser, desde que não prejudique ninguém', 'Retribua o mal com o bem'], 1,
    'É a formulação negativa (shu, reciprocidade). Quando perguntaram se deviam retribuir o mal com bondade, Confúcio respondeu: e com que você vai retribuir a bondade? Retribua o mal com justiça.');
  E('6c', 6, 'O Tao Te Ching é atribuído a:',
    ['Confúcio', 'Lao-Tsé', 'Buda', 'Mêncio'], 1,
    'Lao-Tsé (Laozi), figura meio lendária. O livro começa dizendo que o Tao que pode ser dito não é o Tao eterno.');
  A('6d', 6, 'O que é wu wei no taoismo? Dê uma imagem que o livro ou a tradição usa para explicá-lo.',
    'Wu wei é "ação sem esforço" ou "não ação": agir em harmonia com o curso natural das coisas, sem forçar. A imagem mais comum é a água: é mole e cede, mas contorna os obstáculos e acaba vencendo a pedra. Não é preguiça; é não brigar contra a corrente.');
  E('6e', 6, 'Yin e yang representam:',
    ['O bem e o mal em guerra', 'Forças opostas e complementares que se transformam uma na outra', 'Corpo e alma separados', 'Os dois deuses do taoismo'], 1,
    'Escuro e claro, passivo e ativo, frio e quente. Cada um contém a semente do outro (os pontos no símbolo). O equilíbrio não é a vitória de um lado.');
  E('6f', 6, 'Zhuangzi sonhou que era uma borboleta e, ao acordar, não sabia se era um homem que sonhou ser borboleta ou uma borboleta sonhando ser homem. A história levanta dúvidas sobre:',
    ['A existência de Deus', 'A realidade, a identidade e a fronteira entre sonho e vigília', 'A moral', 'A política'], 1,
    'É parente do argumento do sonho de Descartes, quase dois mil anos antes. Para Zhuangzi, porém, a conclusão é a transformação contínua das coisas, não a busca de uma certeza.');
  A('6g', 6, 'Enuncie as Quatro Nobres Verdades do budismo.',
    '1. A vida envolve sofrimento ou insatisfação (dukkha). 2. A origem do sofrimento é o desejo, a sede e o apego (tanha). 3. O sofrimento pode cessar (nirvana, o apagamento dessa sede). 4. Há um caminho para isso: o Nobre Caminho Óctuplo (visão, intenção, fala, ação, meio de vida, esforço, atenção e concentração corretos).');
  E('6h', 6, 'A doutrina budista do anatta (não-eu) afirma que:',
    ['A alma é eterna e passa de corpo em corpo', 'Não há um eu fixo e permanente; o que chamamos de eu é um fluxo de processos', 'Só os monges têm alma', 'O eu é idêntico a Deus'], 1,
    'Os "agregados" (corpo, sensação, percepção, formações mentais, consciência) mudam sem parar. Hume chegou a algo parecido: ao olhar para dentro, só encontrou um feixe de percepções.');
  E('6i', 6, 'Nas Upanishads, a frase "tu és isso" (tat tvam asi) expressa a ideia de que:',
    ['O indivíduo deve obedecer à casta', 'O eu profundo (Atman) é idêntico à realidade última (Brahman)', 'O mundo é feito de átomos', 'O carma é injusto'], 1,
    'É o centro do Vedanta não dual (Advaita). O budismo vai noutra direção ao negar um Atman permanente.');
  E('6j', 6, 'O que é um koan no zen-budismo?',
    ['Uma oração diária', 'Uma pergunta ou história paradoxal que a lógica comum não resolve, usada para provocar o despertar', 'Uma postura de meditação', 'Um tipo de templo'], 1,
    'Exemplo clássico: "qual é o som de uma mão batendo palma?". O objetivo é esgotar o pensamento conceitual.');
  A('6k', 6, 'Compare o estoicismo e o budismo diante do sofrimento. Onde se parecem e onde diferem?',
    'Parecem-se ao dizer que o sofrimento nasce menos dos fatos que da nossa relação com eles (desejo, apego, juízos), e que a disciplina da mente pode trazer serenidade. Diferem na base: o estoico confia na razão e num cosmos racional (o logos) ao qual deve se conformar, e mantém um eu racional que escolhe; o budista nega um eu permanente e propõe a extinção do apego pela meditação e pelo Caminho Óctuplo, dentro de um quadro de renascimentos e carma.');

  /* ---------- Capítulo 7 ---------- */
  E('7a', 7, '"A existência precede a essência" é a fórmula de qual corrente?',
    ['Essencialismo', 'Existencialismo (Sartre)', 'Positivismo', 'Estoicismo'], 1,
    'Para Sartre, não há natureza humana dada de antemão: primeiro existimos, depois nos definimos pelo que fazemos. Por isso "o homem está condenado a ser livre" e responde pelas próprias escolhas.');
  E('7b', 7, 'Para o pragmatismo de William James, uma ideia é verdadeira quando:',
    ['Copia perfeitamente a realidade', 'Funciona: dá resultados práticos, guia bem a ação e se confirma na experiência', 'É aceita pela maioria', 'É provada pela lógica formal'], 1,
    'Pragmatismo americano: Peirce, James e Dewey. O sentido de uma ideia está nas suas consequências práticas.');
  E('7c', 7, 'A tese de que a realidade é, no fundo, mental ou espiritual (e não material) se chama:',
    ['Materialismo', 'Idealismo', 'Realismo', 'Empirismo'], 1,
    'Berkeley (idealismo subjetivo) e Hegel (idealismo absoluto) são exemplos. O oposto é o materialismo, para o qual tudo, inclusive a mente, é matéria.');
  E('7d', 7, 'O ceticismo de Pirro recomendava, diante de argumentos de força igual dos dois lados:',
    ['Escolher o mais antigo', 'Suspender o juízo (epoché) e assim alcançar a tranquilidade', 'Seguir a maioria', 'Confiar só nos sentidos'], 1,
    'Ceticismo antigo: como sempre há bons argumentos contra e a favor, quem suspende o juízo para de se angustiar. Sexto Empírico registrou essa escola.');
  A('7e', 7, 'Qual é o problema clássico do relativismo forte ("toda verdade é relativa")?',
    'Ele se refuta: se toda verdade é relativa, a própria frase "toda verdade é relativa" também é, e não vale para quem discorda; se ela vale para todos, então existe ao menos uma verdade absoluta. Platão já usou esse argumento contra Protágoras no Teeteto. Uma versão moderada (algumas coisas variam conforme a cultura) não tem esse problema.');
  E('7f', 7, 'O dualismo cartesiano diz que a pessoa é composta de:',
    ['Corpo e alma, ambos materiais', 'Uma substância pensante (mente) e uma substância extensa (corpo), de naturezas diferentes', 'Átomos e vazio', 'Razão e emoção'], 1,
    'Res cogitans e res extensa. O grande problema: como duas substâncias tão diferentes interagem? Descartes apontou a glândula pineal, o que satisfez pouca gente.');
  E('7g', 7, 'O positivismo lógico do Círculo de Viena dizia que uma frase só tem significado se:',
    ['For bela', 'Puder ser verificada pela experiência, ou for verdadeira por definição (lógica e matemática)', 'For aceita pela Igreja', 'Expressar um sentimento'], 1,
    'É o princípio de verificação. Com ele, a metafísica e boa parte da ética viravam frases sem sentido. A crítica clássica: o próprio princípio não é verificável pela experiência.');
  E('7h', 7, 'O determinismo afirma que:',
    ['Tudo acontece por acaso', 'Todo evento, incluindo nossas escolhas, é efeito necessário de causas anteriores', 'O futuro depende só da vontade', 'Deus intervém a cada instante'], 1,
    'Se for verdade, o livre-arbítrio fica em xeque. Os compatibilistas (Hume, por exemplo) respondem que ser livre é agir conforme a própria vontade sem coação, mesmo num mundo determinado.');
  E('7i', 7, 'O niilismo, no sentido que Nietzsche discute, é:',
    ['A crença no nada como divindade', 'A perda ou ausência de valores e de sentido último', 'Um método científico', 'Uma escola de lógica'], 1,
    'Nietzsche via o niilismo como consequência da "morte de Deus" e queria superá-lo com a criação de novos valores, não aceitá-lo.');

  /* ---------- Capítulo 8 ---------- */
  A('8a', 8, 'Qual a diferença entre dedução e indução? Dê um exemplo de cada.',
    'Dedução: do geral para o particular; se as premissas são verdadeiras e a forma é válida, a conclusão é certa ("Todo homem é mortal; Sócrates é homem; logo Sócrates é mortal"). Indução: de casos observados para uma generalização; a conclusão é só provável ("Todos os cisnes que vi são brancos; logo todos os cisnes são brancos", falso desde que acharam cisnes negros na Austrália). A indução amplia o conhecimento; a dedução apenas explicita o que já estava nas premissas.');
  E('8b', 8, '"Se chove, a rua molha. Choveu. Logo, a rua molhou." Essa forma válida se chama:',
    ['Modus ponens', 'Modus tollens', 'Afirmação do consequente', 'Silogismo disjuntivo'], 0,
    'Modus ponens: se P então Q; P; logo Q.');
  E('8c', 8, '"Se chove, a rua molha. A rua não molhou. Logo, não choveu." Essa forma válida se chama:',
    ['Modus ponens', 'Modus tollens', 'Negação do antecedente', 'Falso dilema'], 1,
    'Modus tollens: se P então Q; não Q; logo não P. É a forma da refutação científica de Popper: a teoria prevê Q, Q não acontece, a teoria cai.');
  E('8d', 8, '"Se chove, a rua molha. A rua está molhada. Logo, choveu." O que há de errado?',
    ['Nada, é válido', 'É a falácia da afirmação do consequente: a rua pode ter molhado por outro motivo', 'É modus tollens', 'É petição de princípio'], 1,
    'Alguém pode ter lavado a calçada. Parece modus ponens, mas inverte a ordem.');
  E('8e', 8, '"Esta frase é falsa." Se for verdadeira, é falsa; se for falsa, é verdadeira. Esse é:',
    ['O paradoxo de Zenão', 'O paradoxo do mentiroso', 'O paradoxo sorites', 'O dilema de Eutífron'], 1,
    'Versão antiga: Epimênides, cretense, disse que todos os cretenses mentem. Problemas de autorreferência como esse marcaram a lógica do século XX (Russell, Tarski, Gödel).');
  E('8f', 8, 'Aquiles nunca alcança a tartaruga, porque sempre precisa chegar primeiro onde ela estava. Esse paradoxo, de Zenão de Eleia, pretendia defender:',
    ['O atomismo', 'A tese de Parmênides de que o movimento é ilusório', 'A existência dos deuses', 'O ceticismo moral'], 1,
    'A matemática das séries infinitas convergentes (uma soma infinita pode dar um valor finito) explica por que Aquiles alcança a tartaruga, mas isso só foi formalizado muitos séculos depois.');
  E('8g', 8, 'Um grão de areia não é um monte. Somar um grão a algo que não é monte não o transforma em monte. Logo, nunca existe monte. Esse paradoxo, sobre a vagueza dos conceitos, é o:',
    ['Paradoxo sorites', 'Paradoxo do barbeiro', 'Paradoxo do mentiroso', 'Paradoxo de Zenão'], 0,
    'Sorites vem de soros, "monte". Vale para "careca", "alto", "velho": conceitos sem fronteira exata. Mostra um limite da lógica clássica, que exige que cada frase seja verdadeira ou falsa.');
  E('8h', 8, 'O princípio da não contradição diz que:',
    ['Tudo tem uma causa', 'Uma coisa não pode ser e não ser ao mesmo tempo e sob o mesmo aspecto', 'Toda frase é verdadeira ou falsa', 'Entre duas explicações, prefira a mais simples'], 1,
    'Aristóteles o considerava o princípio mais firme de todos. O de "toda frase é verdadeira ou falsa" é outro: o terceiro excluído.');
  E('8i', 8, 'O que os teoremas da incompletude de Gödel (1931) mostraram?',
    ['Que a matemática é inconsistente', 'Que, em qualquer sistema formal consistente capaz de fazer aritmética, há verdades que não podem ser provadas dentro dele', 'Que a lógica é inútil', 'Que todo problema tem solução'], 1,
    'Foi o golpe no programa de Hilbert, que queria uma matemática completa e provadamente consistente. É o exemplo mais famoso de um limite interno da lógica.');
  E('8j', 8, 'Popper respondeu ao problema da indução dizendo que a ciência avança:',
    ['Confirmando teorias com cada vez mais casos', 'Propondo hipóteses ousadas e tentando refutá-las (falseabilidade)', 'Pela intuição dos gênios', 'Pelo consenso dos cientistas'], 1,
    'Mil cisnes brancos não provam que todos são brancos; um cisne negro refuta. Para Popper, uma teoria só é científica se puder, em princípio, ser falseada.');

  /* ---------- Capítulo 9 ---------- */
  E('9a', 9, 'A definição clássica de conhecimento, que vem do Teeteto de Platão, é:',
    ['Opinião da maioria', 'Crença verdadeira justificada', 'Percepção sensível', 'Lembrança de vidas passadas'], 1,
    'Três condições: você acredita que P; P é verdadeiro; você tem boas razões para acreditar. Uma crença verdadeira por sorte (um palpite) não é conhecimento.');
  A('9b', 9, 'O que Edmund Gettier mostrou em 1963? Construa um caso no estilo dele.',
    'Que crença verdadeira justificada não basta para haver conhecimento. Caso: você olha um relógio da praça que sempre funcionou, ele marca 14h e você acredita que são 14h. De fato são 14h, mas o relógio parou exatamente 24 horas antes. Sua crença é verdadeira e justificada, mas acertou por sorte; não parece conhecimento. (O exemplo do relógio é de Russell, anterior a Gettier, mas tem a mesma estrutura.) Depois disso, muitos tentaram uma quarta condição.');
  E('9c', 9, 'Conhecimento a priori é aquele que:',
    ['Vem antes de qualquer pensamento', 'Pode ser justificado independentemente da experiência (como "2 + 2 = 4")', 'Vem da tradição', 'Só os filósofos possuem'], 1,
    'A posteriori é o que depende da experiência ("está chovendo lá fora"). A distinção é sobre como se justifica, não sobre quando se aprende.');
  E('9d', 9, '"Todo solteiro é não casado" é um juízo:',
    ['Sintético a posteriori', 'Analítico: o predicado já está contido no conceito do sujeito', 'Sintético a priori', 'Falso'], 1,
    'Analítico: verdadeiro só pelo significado das palavras, não acrescenta informação. Sintético: o predicado acrescenta algo ("o solteiro está triste").');
  E('9e', 9, 'Para Kant, "7 + 5 = 12" é um exemplo de juízo:',
    ['Analítico a posteriori', 'Sintético a priori', 'Analítico a priori', 'Empírico'], 1,
    'Sintético, porque o conceito de 12 não está contido em "7 + 5" (é preciso fazer a síntese na intuição); a priori, porque é necessário e universal, não vem da experiência. A pergunta central da Crítica da Razão Pura é: como são possíveis juízos sintéticos a priori?');
  E('9f', 9, 'No diálogo Mênon, Sócrates faz um menino escravo, sem estudo, chegar a um resultado de geometria só com perguntas. Platão usa isso para defender que:',
    ['A educação é inútil', 'Aprender é recordar (anamnese): a alma já conhecia as verdades antes de nascer', 'Os escravos são mais inteligentes', 'Geometria vem da experiência'], 1,
    'É a origem da tese das ideias inatas, que Descartes e Leibniz retomam de outro modo e que Locke ataca com a tábula rasa.');
  E('9g', 9, 'Leibniz distinguiu "verdades de razão" e "verdades de fato". As de razão são:',
    ['Contingentes, conhecidas pela experiência', 'Necessárias: o contrário é impossível (contradição)', 'Opiniões pessoais', 'Verdades reveladas'], 1,
    'Verdades de fato são contingentes (o contrário é possível: César poderia não ter cruzado o Rubicão) e se apoiam no princípio de razão suficiente.');
  E('9h', 9, 'Locke separa qualidades primárias e secundárias. Qual destas é secundária?',
    ['Forma', 'Extensão', 'Cor', 'Movimento'], 2,
    'Primárias (forma, tamanho, movimento, número, solidez) estariam nos próprios objetos. Secundárias (cor, sabor, som, cheiro) dependem de como os objetos afetam nossos sentidos. Berkeley argumentou que as primárias são tão dependentes da percepção quanto as secundárias.');
  E('9i', 9, 'O experimento do "cérebro numa cuba" é uma versão moderna de qual argumento?',
    ['Do primeiro motor', 'Do gênio maligno de Descartes: ceticismo radical sobre o mundo exterior', 'Da caverna como teoria política', 'Do anel de Giges'], 1,
    'Se um cientista estimulasse um cérebro isolado para gerar exatamente as experiências que você tem, como você saberia que não é esse cérebro? Hilary Putnam discutiu o caso em 1981.');
  E('9j', 9, 'Fundacionalismo e coerentismo são duas respostas sobre a estrutura da justificação. O coerentismo diz que:',
    ['Toda crença se apoia em crenças básicas indubitáveis', 'Uma crença é justificada por se encaixar num sistema coerente de crenças que se apoiam mutuamente', 'Nenhuma crença é justificada', 'Só a ciência justifica'], 1,
    'O fundacionalismo (Descartes é o exemplo) quer alicerces firmes, como num prédio. O coerentismo prefere a imagem de uma teia, ou do barco de Neurath, consertado em alto-mar tábua por tábua.');
  A('9k', 9, 'Defenda, usando o que aprendeu, que o conhecimento humano mistura empirismo e racionalismo.',
    'Os sentidos fornecem o material: sem experiência não saberíamos que a água ferve ou que o fogo queima, e muitas certezas racionalistas (como a física de Descartes) caíram diante da observação. Mas a experiência sozinha não basta: para tirar conclusões de dados precisamos de princípios que não vêm deles (não contradição, causalidade, matemática), e Hume mostrou que a indução não se justifica só pela experiência. Kant formulou a síntese: "pensamentos sem conteúdo são vazios, intuições sem conceitos são cegas". A ciência moderna faz isso na prática, unindo modelo matemático e experimento.');

  /* ---------- Capítulo 10 ---------- */
  E('10a', 10, 'O utilitarismo de Bentham e Mill julga uma ação certa quando ela:',
    ['Segue um dever universal', 'Produz a maior felicidade para o maior número de pessoas', 'É feita por alguém virtuoso', 'Agrada a Deus'], 1,
    'É consequencialista: o que importa são os resultados. Bentham chegou a propor um "cálculo felicífico" de prazeres e dores.');
  E('10b', 10, 'Mill corrigiu Bentham ao dizer que há prazeres superiores e inferiores. Qual frase resume isso?',
    ['"O homem é o lobo do homem"', '"É melhor ser um Sócrates insatisfeito do que um tolo satisfeito"', '"Penso, logo existo"', '"Conhece-te a ti mesmo"'], 1,
    'Em Utilitarismo (1861). Prazeres intelectuais e morais valem mais que os apenas corporais, segundo quem conhece os dois.');
  E('10c', 10, 'A primeira fórmula do imperativo categórico de Kant manda:',
    ['Agir para maximizar a felicidade', 'Agir só segundo a máxima que você possa querer que se torne lei universal', 'Agir como um homem virtuoso agiria', 'Obedecer às leis do Estado'], 1,
    'Teste: se todos fizessem isso (por exemplo, prometer sem intenção de cumprir), a máxima se destruiria? Se sim, é proibido. É uma ética deontológica, do dever.');
  E('10d', 10, 'Outra fórmula do imperativo categórico diz para tratar a humanidade, em você e nos outros:',
    ['Como um meio para a felicidade geral', 'Sempre também como fim, nunca apenas como meio', 'Conforme a tradição', 'Conforme a sua utilidade'], 1,
    'É a base da ideia de dignidade humana: pessoas têm valor em si, não um preço. Usar alguém só como instrumento (enganar, manipular) é errado mesmo que dê bom resultado.');
  E('10e', 10, 'Qual a diferença entre imperativo hipotético e categórico?',
    ['Nenhuma', 'O hipotético vale se você quer um fim ("se quer passar, estude"); o categórico vale incondicionalmente ("não minta")', 'O hipotético é moral e o categórico é técnico', 'O categórico só vale para religiosos'], 1,
    'Para Kant, só o categórico é propriamente moral, porque não depende dos desejos de quem age.');
  A('10f', 10, 'Um assassino bate à sua porta perguntando onde seu amigo se escondeu. Kant diria que você pode mentir? Por que essa resposta incomoda tanta gente, e o que um utilitarista diria?',
    'Kant, no ensaio "Sobre um suposto direito de mentir por amor à humanidade" (1797), diz que não: mentir é sempre errado, porque a máxima da mentira não pode ser universalizada, e as consequências não entram no cálculo moral. Incomoda porque parece monstruoso entregar o amigo; muitos kantianos depois propuseram saídas (calar, recusar responder). O utilitarista diria que mentir é obrigatório: salvar uma vida produz muito mais bem do que a mentira causa de mal.');
  E('10g', 10, 'Para a ética das virtudes, de raiz aristotélica, a pergunta central é:',
    ['Qual regra devo seguir?', 'Que consequências minha ação vai ter?', 'Que tipo de pessoa devo ser?', 'O que a lei permite?'], 2,
    'O foco sai do ato isolado para o caráter: virtudes como coragem, justiça, temperança e prudência (phronesis), formadas pelo hábito, rumo à eudaimonia. Foi retomada no século XX por Elizabeth Anscombe e Alasdair MacIntyre.');
  A('10h', 10, 'Explique o problema do bonde e como cada grande teoria ética tende a respondê-lo.',
    'Um bonde desgovernado vai matar cinco pessoas; puxando uma alavanca, você o desvia para um trilho onde mata uma (Philippa Foot, 1967; Judith Thomson criou a variante de empurrar um homem gordo da ponte). Utilitarismo: puxe, cinco vidas valem mais que uma, e pela mesma conta empurre o homem. Kant: matar alguém usando-o como meio é proibido; desviar é mais discutível, mas empurrar o homem é claramente errado. Ética das virtudes: pergunta o que uma pessoa prudente e compassiva faria e desconfia de fórmulas. A maioria das pessoas puxa a alavanca e não empurra o homem, o que mostra que nossas intuições não são puramente utilitaristas.');
  E('10i', 10, 'A "guilhotina de Hume" afirma que:',
    ['A razão deve governar as paixões', 'Não se deduz logicamente um "deve" a partir apenas de um "é" (fatos sozinhos não geram obrigações)', 'O Estado pode punir com a morte', 'Toda moral é religiosa'], 1,
    'No Tratado da Natureza Humana (1739–40). Do fato "o fumo faz mal" não sai "você deve parar" sem uma premissa de valor ("você deve evitar o que faz mal"). Hume também dizia que "a razão é, e deve ser, escrava das paixões".');
  E('10j', 10, 'G. E. Moore (1903) chamou de "falácia naturalista" a tentativa de:',
    ['Defender a natureza', 'Definir "bom" por uma propriedade natural, como "prazeroso" ou "mais evoluído"', 'Usar exemplos da biologia em ética', 'Negar a existência de Deus'], 1,
    'Seu argumento da "questão aberta": se bom = prazeroso, perguntar "o prazeroso é bom?" seria trivial; como não é, a definição falha. Moore concluía que "bom" é uma propriedade simples, indefinível.');
  E('10k', 10, 'No Eutífron de Platão: o que é piedoso é amado pelos deuses porque é piedoso, ou é piedoso porque é amado pelos deuses? O dilema questiona:',
    ['Se os deuses existem', 'Se a moral depende da vontade divina ou tem fundamento próprio', 'Se Sócrates era religioso', 'Se a justiça é útil'], 1,
    'Se é bom só porque Deus manda, a moral fica arbitrária; se Deus manda porque é bom, o bem existe independentemente da vontade divina. O dilema segue vivo na filosofia da religião.');
  E('10l', 10, 'O mito do anel de Giges, na República de Platão, pergunta:',
    ['Se a riqueza traz felicidade', 'Se alguém continuaria justo se pudesse ficar invisível e agir sem nenhuma consequência', 'Se os reis devem ser filósofos', 'Se a alma é imortal'], 1,
    'Gláucon conta a história do pastor que acha um anel que o torna invisível e passa a seduzir, matar e tomar o poder. A tese a refutar: somos justos só por medo da punição. O resto da República tenta mostrar que a justiça vale por si.');
  A('10m', 10, 'Diferencie relativismo moral de universalismo moral e aponte uma objeção forte contra cada um.',
    'Relativismo: o certo e o errado dependem da cultura ou do indivíduo; não há padrão acima delas. Objeção: ficaríamos sem base para condenar a escravidão ou o genocídio feitos "conforme os costumes", e o reformador moral (quem lutou contra a escravidão) estaria sempre errado por contrariar sua cultura. Universalismo: existem princípios morais válidos para todos (direitos humanos, imperativo categórico, maximização do bem-estar). Objeção: quem decide quais são esses princípios, e como evitar que se imponham valores de uma cultura sobre as outras? E as divergências morais reais são profundas.');

  window.ESTUDOS_LIVROS = LIVROS;
  window.ESTUDOS_QUESTOES = QUESTOES;
})();
