/* Norte: funções de criação com base nos livros de escrita criativa.
   Tudo aqui é sugestão. O autor apaga, troca de ordem, ignora. */
const NORTE = {
  /* papéis de personagem (Vogler, A jornada do escritor; Truby, Anatomia de uma história) */
  PAPEIS: {
    protagonista: { nome: 'Protagonista', fonte: 'Truby', desc: 'Quem quer algo e paga o preço da história.' },
    oponente: { nome: 'Oponente', fonte: 'Truby', desc: 'Quer a mesma coisa que o protagonista, ou o impede de conseguir. O melhor oponente ataca a fraqueza dele.' },
    aliado: { nome: 'Aliado', fonte: 'Vogler / Truby', desc: 'Ajuda o protagonista e mostra outro jeito de encarar o problema.' },
    mentor: { nome: 'Mentor', fonte: 'Vogler', desc: 'Dá ao protagonista algo de que ele precisa: um conselho, um objeto, uma coragem. Pode falhar ou trair.' },
    camaleao: { nome: 'Camaleão (falso aliado)', fonte: 'Vogler: camaleão; Truby: falso aliado', desc: 'Muda de lado ou de cara. Ninguém sabe ao certo o que quer.' },
    guardiao: { nome: 'Guardião do limiar', fonte: 'Vogler', desc: 'Barra a passagem num momento-chave: um porteiro, uma lei, um parente.' },
    arauto: { nome: 'Arauto', fonte: 'Vogler', desc: 'Traz a notícia ou o desafio que põe a história em movimento.' },
    picaro: { nome: 'Pícaro', fonte: 'Vogler', desc: 'Quebra a tensão, debocha, mostra o ridículo das coisas.' },
    espelho: { nome: 'Espelho', fonte: 'Truby', desc: 'Enfrenta o mesmo problema do protagonista e escolhe outro caminho; mostra o que ele poderia virar.' },
    sombra: { nome: 'Sombra', fonte: 'Vogler', desc: 'A força que representa o lado escuro, de fora ou de dentro do protagonista.' }
  },
  /* roteiro do criador guiado de personagem */
  ROTEIRO: [
    { k: 'O que quer', p: 'O que esta pessoa persegue ao longo do livro? Algo que dê para ver se ela conseguiu ou não.', dica: 'Desejo é o objetivo consciente, que move a trama.', fonte: 'Truby, Anatomia de uma história', pool: 'desejos' },
    { k: 'O que precisa (e não sabe)', p: 'O que precisa mudar por dentro dela? Costuma ser o contrário do que ela acredita.', dica: 'A necessidade é interna e o personagem não a enxerga no começo.', fonte: 'Truby, Anatomia de uma história', pool: 'necessidades' },
    { k: 'Ferida / fantasma', p: 'O que aconteceu antes do livro e ainda manda nas decisões dela?', dica: 'O fantasma é o passado que ainda assombra e explica a fraqueza.', fonte: 'Truby, Anatomia de uma história', pool: 'feridas' },
    { k: 'A mentira em que acredita', p: 'Que ideia errada sobre si ou sobre o mundo a história vai pôr à prova?', dica: 'O arco nasce da mentira: a história a confirma, a quebra ou a aprofunda.', fonte: 'K. M. Weiland, Creating Character Arcs', pool: 'mentiras' },
    { k: 'Contradição', p: 'Onde ela age contra o que diz ser?', dica: 'O personagem redondo é capaz de surpreender de modo convincente.', fonte: 'E. M. Forster, Aspectos do romance', pool: 'contradicoes' },
    { k: 'Sob pressão', p: 'O que ela faz quando perde, quando tem medo, quando ninguém está olhando?', dica: 'O caráter verdadeiro só aparece nas escolhas feitas sob pressão.', fonte: 'Robert McKee, Story', pool: 'pressao' },
    { k: 'Como fala', p: 'Que palavras usa, o que nunca diz, como fala quando mente?', dica: 'A fala é caráter em ação; diálogo bom carrega o que não é dito.', fonte: 'Stephen King, Sobre a escrita', pool: 'falas' },
    { k: 'Segredo', p: 'O que ela esconde dos outros, ou de si mesma?', dica: 'Um segredo dá subtexto a cada cena em que ela aparece.', fonte: 'Prática de oficina', pool: 'segredos' }
  ],
  POOLS: {
    desejos: ['recuperar a casa da família antes do leilão', 'ser perdoado por alguém que já morreu', 'ganhar uma corrida que perdeu dez anos atrás', 'tirar o irmão de uma dívida com gente perigosa', 'provar que não matou ninguém', 'ir embora da cidade sem que ninguém descubra', 'encontrar o pai que nunca conheceu', 'ser reconhecida pelo trabalho que outro assinou', 'manter o casamento de aparência até a eleição', 'vingar uma humilhação pública', 'proteger um segredo que sustenta a família', 'comprar de volta um objeto vendido na pressa', 'chegar a tempo para um enterro', 'ser aceito no grupo que o rejeitou'],
    necessidades: ['aprender a pedir ajuda', 'aceitar que não controla os outros', 'parar de se punir pelo que não podia evitar', 'admitir o que sente antes que seja tarde', 'ver as pessoas como elas são, não como precisa que sejam', 'abrir mão de ter razão', 'perdoar a si mesmo', 'dizer não', 'separar amor de dívida', 'confiar de novo'],
    feridas: ['foi deixado na casa de parentes quando criança', 'viu o pai ser humilhado e não fez nada', 'perdeu um irmão num acidente que poderia ter evitado', 'foi acusado injustamente e ninguém acreditou nele', 'cresceu sendo o orgulho da família e falhou uma vez, em público', 'traiu a melhor amiga para se salvar', 'foi expulso de casa por quem ele era', 'passou fome e jurou nunca mais', 'cuidou da mãe doente e perdeu a juventude', 'sobreviveu quando os outros não'],
    mentiras: ['se eu precisar de alguém, vou ser abandonado', 'quem é bom se dá mal', 'dinheiro resolve o que o afeto não resolveu', 'eu só valho pelo que produzo', 'sentir é fraqueza', 'a culpa é sempre de alguém de fora', 'se eu for sincero, vão me deixar', 'o mundo é dividido entre quem engana e quem é enganado', 'não mereço coisa boa', 'posso consertar tudo sozinho'],
    contradicoes: ['é generoso com estranhos e mesquinho com a família', 'prega disciplina e não cumpre nada do que promete a si mesmo', 'é violento e cuida de passarinhos com uma ternura que ninguém vê', 'diz que não liga para dinheiro e conta cada centavo', 'é corajoso diante da morte e covarde diante de uma conversa', 'despreza a cidade natal e não consegue sair dela', 'defende a verdade e mente sobre a própria idade', 'é religiosa e faz um pacto que a fé condena'],
    pressao: ['mente rápido e bem', 'fica gentil demais, o que assusta', 'some sem avisar', 'ataca quem está mais perto', 'faz piada até o fim', 'assume a culpa dos outros', 'trabalha até cair', 'procura a mãe, mesmo adulto', 'gasta tudo o que tem', 'fica em silêncio e depois explode'],
    falas: ['responde pergunta com pergunta', 'nunca termina as frases quando está nervoso', 'fala bonito demais, como quem leu muito e conversou pouco', 'usa diminutivos para tudo, menos para o que dói', 'xinga com carinho e elogia com raiva', 'repete o nome da pessoa com quem fala', 'cita a avó como autoridade final', 'fala pouco e sempre a última palavra'],
    segredos: ['tem outro filho em outra cidade', 'nunca leu o livro que diz ser o favorito', 'sabe quem causou o incêndio', 'está doente e não contou', 'vendeu a terra da família sem avisar ninguém', 'escreve cartas que nunca envia', 'foi ele quem denunciou o amigo', 'ainda ama a pessoa de quem diz ter raiva']
  },
  /* dicas para campos já existentes nas fichas (pela palavra do campo) */
  DICAS_CAMPO: [
    [/quer|desejo|objetivo/i, 'O desejo é o objetivo consciente, o que move a trama.', 'Truby'],
    [/precisa|necessidade/i, 'A necessidade é o que precisa mudar por dentro, e o personagem não vê.', 'Truby'],
    [/ferida|fantasma|passado/i, 'O fantasma é o passado que ainda manda nas decisões.', 'Truby'],
    [/mentira|cren[cç]a/i, 'A história testa essa crença: confirma, quebra ou aprofunda.', 'Weiland'],
    [/contradi/i, 'O personagem redondo surpreende de modo convincente.', 'Forster'],
    [/press[aã]o|medo|teme/i, 'O caráter verdadeiro aparece nas escolhas sob pressão.', 'McKee'],
    [/fala|voz/i, 'Diálogo bom carrega o que não é dito.', 'King'],
    [/segredo/i, 'Um segredo dá subtexto a toda cena em que ele aparece.', 'oficina'],
    [/apar[eê]ncia|olhos|cabelo/i, 'Um detalhe concreto e significativo vale mais que uma lista de traços.', 'Gardner, A arte da ficção'],
    [/cheiro|som|clima|detalhe/i, 'Detalhes concretos sustentam o sonho vívido e contínuo do leitor.', 'Gardner, A arte da ficção'],
    [/pressiona|aperta|import[aâ]ncia/i, 'O lugar é força na história: ele empurra, prende ou expulsa os personagens.', 'oficina']
  ],
  /* estruturas para o quadro do enredo */
  ESTRUTURAS: [
    { id: 'tresatos', nome: 'Três atos', fonte: 'Robert McKee, Story; Syd Field, Manual do roteiro', quando: 'Quase tudo. Boa para começar quando você já sabe o que o protagonista quer.',
      etapas: [['Antes de tudo', 'Quem é essa pessoa e o que está parado na vida dela antes da história começar?', 1], ['Incidente incitante', 'Que acontecimento desequilibra a vida dela e a faz querer algo?', 1], ['Primeira virada', 'Que decisão sem volta joga a história para o segundo ato?', 1], ['Complicações', 'O que dá errado cada vez que ela tenta conseguir o que quer?', 2], ['Ponto central', 'O que ela descobre no meio que muda o sentido da busca?', 2], ['Crise', 'Qual escolha impossível ela precisa fazer?', 2], ['Clímax', 'O que ela faz quando não dá mais para fugir?', 3], ['Depois', 'Como ficaram o mundo e ela?', 3]] },
    { id: 'jornada', nome: 'Jornada do herói', fonte: 'Christopher Vogler, A jornada do escritor (a partir de Joseph Campbell)', quando: 'Histórias de travessia e transformação. O próprio Vogler diz que as etapas podem ser cortadas, repetidas ou trocadas de lugar.',
      etapas: [['Mundo comum', 'Como é a vida antes? O que falta nela?', 1], ['Chamado', 'O que convida ou obriga a sair do lugar?', 1], ['Recusa', 'Do que ele tem medo? Por que diz não?', 1], ['Mentor', 'Quem ou o que dá a força, o conselho ou o objeto para ir?', 1], ['Travessia do limiar', 'Qual o momento em que não dá mais para voltar?', 1], ['Testes, aliados e inimigos', 'Quem ele conhece do outro lado? O que aprende apanhando?', 2], ['Aproximação', 'Como ele chega perto do perigo maior?', 2], ['Provação', 'Qual a hora em que quase morre, de verdade ou por dentro?', 2], ['Recompensa', 'O que ele ganha por ter sobrevivido?', 2], ['Caminho de volta', 'O que o persegue na volta?', 3], ['Ressurreição', 'Qual o último teste, em que mostra que mudou?', 3], ['Retorno com o elixir', 'O que ele traz de volta para o mundo comum? E o que perdeu?', 3]] },
    { id: 'avessas', nome: 'Jornada às avessas', fonte: 'Aristóteles, Poética (falha trágica); John Truby (autorrevelação)', quando: 'Quando o herói não sai limpo: ganha algo e perde algo que não volta.',
      etapas: [['Mundo comum', 'Como é a vida antes, e o que ele acha que merece?', 1], ['Desejo', 'O que ele quer a ponto de pagar qualquer preço?', 1], ['A primeira concessão', 'Qual o primeiro atalho moral que ele toma, achando que é só desta vez?', 1], ['Ganho que custa', 'O que dá certo, e o que isso tira de alguém?', 2], ['Ponto sem volta', 'Que linha ele cruza e sabe que cruzou?', 2], ['Reconhecimento', 'Quando ele se vê como os outros o veem?', 2], ['O preço', 'O que a história cobra dele, ou de quem ele ama?', 3], ['Final ambíguo', 'O que fica: vitória, perda, as duas? O leitor decide o que pensar dele.', 3]] },
    { id: 'gato', nome: 'Salve o gato', fonte: 'Blake Snyder, Salve o gato!', quando: 'Ritmo de filme: ajuda a ver onde a história arrasta.',
      etapas: [['Imagem de abertura', 'Que imagem resume quem ele é no começo?', 1], ['Tema apresentado', 'Alguém diz, sem saber, o que ele vai ter de aprender?', 1], ['Preparação', 'O que está errado na vida dele e precisa mudar?', 1], ['Catalisador', 'O que acontece e vira tudo?', 1], ['Debate', 'Ele vai ou não vai?', 1], ['Entrada no segundo ato', 'A escolha que leva a outro mundo.', 2], ['História B', 'Que relação (amor, amizade) vai carregar o tema?', 2], ['Diversão e jogos', 'A promessa da premissa: o que o leitor veio ver?', 2], ['Ponto central', 'Falsa vitória ou falsa derrota?', 2], ['Os maus se aproximam', 'O que aperta por fora e por dentro?', 2], ['Tudo está perdido', 'O fundo do poço; algo ou alguém morre.', 2], ['Noite escura', 'Como ele reage ao fundo do poço?', 2], ['Entrada no terceiro ato', 'O que ele entende que dá a saída?', 3], ['Final', 'Como ele usa o que aprendeu?', 3], ['Imagem final', 'Que imagem mostra o quanto ele mudou, ou não?', 3]] },
    { id: 'sete', nome: 'Sete pontos', fonte: 'Dan Wells (a partir do guia de RPG de Star Trek)', quando: 'Para planejar de trás para frente: comece pela resolução.',
      etapas: [['Gancho', 'O estado inicial, o oposto do final.', 1], ['Primeira virada', 'O que põe o conflito em movimento?', 1], ['Primeiro aperto', 'A pressão que obriga a agir.', 2], ['Ponto central', 'Quando ele deixa de reagir e passa a agir.', 2], ['Segundo aperto', 'O golpe que tira tudo.', 2], ['Segunda virada', 'O que ele descobre que permite vencer?', 3], ['Resolução', 'Comece por aqui: como termina?', 3]] },
    { id: 'kishoten', nome: 'Kishōtenketsu', fonte: 'Tradição narrativa chinesa e japonesa', quando: 'Histórias sem um grande conflito, em que a força está numa mudança de olhar.',
      etapas: [['Ki: apresentação', 'Personagens e mundo, sem pressa.', 1], ['Shō: desenvolvimento', 'Aprofunda o que foi mostrado, sem virar nada.', 2], ['Ten: virada', 'Um elemento inesperado, às vezes sem ligação aparente.', 2], ['Ketsu: conclusão', 'Junta as partes e muda o sentido do que veio antes.', 3]] },
    { id: 'conto', nome: 'Conto: duas histórias', fonte: 'Ricardo Piglia, Teses sobre o conto; Julio Cortázar, Alguns aspectos do conto; Edgar Allan Poe, A filosofia da composição', quando: 'Contos. O conto conta uma história visível e esconde outra; o final faz a escondida aparecer.',
      etapas: [['Efeito final', 'Poe começava pelo efeito: o que o leitor deve sentir na última linha?', 1], ['História visível', 'O que acontece na superfície?', 1], ['História secreta', 'O que de fato está acontecendo, por baixo?', 2], ['Onde a secreta vaza', 'Em quais detalhes ela aparece sem ser dita?', 2], ['Nocaute', 'Cortázar: o romance ganha por pontos, o conto por nocaute. Qual é o golpe?', 3]] },
    { id: 'situacao', nome: 'Situação, sem enredo', fonte: 'Stephen King, Sobre a escrita', quando: 'Quando você quer descobrir a história escrevendo. King põe personagens numa enrascada e observa como saem.',
      etapas: [['A situação', 'Quem está em apuros, e qual é o apuro?', 1], ['E se...?', 'Escreva a pergunta que acende a história.', 1], ['Primeira reação', 'O que essa pessoa faz primeiro, sem pensar?', 2], ['O que você ainda não sabe', 'Deixe aqui as dúvidas; a escrita vai responder.', 3]] }
  ],
  /* viradas (Aristóteles: peripécia e reconhecimento; Tchékhov; Truby; McKee) */
  VIRADAS: [
    ['Alguém descobre quem o outro realmente é.', 'Aristóteles: reconhecimento'], ['Uma ação produz o efeito contrário ao que se queria.', 'Aristóteles: peripécia'],
    ['O protagonista consegue o que queria, e é a pior coisa que podia acontecer.', 'McKee: a brecha entre expectativa e resultado'], ['Um objeto mostrado lá atrás ganha outra função agora.', 'Tchékhov: a arma na parede'],
    ['O aliado quer a mesma coisa que o oponente.', 'Truby: teia de personagens'], ['O oponente tem razão, pelo menos em parte.', 'Truby: oponente à altura'],
    ['Quem conta a história omitiu algo desde o começo.', 'Narrador não confiável'], ['Um secundário toma uma decisão que ninguém esperava, e ela combina com quem ele sempre foi.', 'Forster: surpreender de modo convincente'],
    ['Aparece um prazo: o tempo começa a correr.', 'Relógio da história'], ['Alguém volta: um morto, um ausente, um credor.', 'Retorno'],
    ['O segredo do protagonista cai nas mãos da pessoa errada.', 'Ironia dramática'], ['A ajuda vem de quem ele desprezava.', 'Inversão de papel'],
    ['O lugar muda: a casa vendida, a rua alagada, a cidade em festa.', 'Lugar como força'], ['Uma escolha pequena do começo cobra o preço agora.', 'Causa e consequência'],
    ['Duas linhas da história se cruzam onde ninguém esperava.', 'Trama e subtrama'], ['O protagonista desiste, e a história segue sem ele por um tempo.', 'Quebra de expectativa'],
    ['O leitor sabe de algo que o personagem não sabe.', 'Ironia dramática'], ['Conte a próxima cena pelos olhos de quem perde.', 'Troca de ponto de vista'],
    ['Uma promessa feita no começo é quebrada.', 'Ruptura'], ['O desejo muda: ele percebe que queria outra coisa.', 'Truby: desejo revisto'],
    ['Alguém que devia morrer vive; alguém que devia viver morre.', 'Quebra de expectativa'], ['Corte a cena que parecia essencial e veja o que sobra.', 'King: escrever é reescrever']
  ],
  PERGUNTAS: ['O que ela carrega nos bolsos?', 'Qual a primeira lembrança dele?', 'O que faria se tivesse certeza de que ninguém ia descobrir?', 'Do que tem vergonha?', 'Quem ele era antes do que aconteceu?', 'Que palavra usa demais?', 'O que a faz rir sem querer?', 'O que não perdoa, em si e nos outros?', 'Para quem liga às três da manhã?', 'Que lugar evita?', 'O que quer que pensem dele, e o que pensam de verdade?', 'Que objeto salvaria de um incêndio?', 'Como reage quando é humilhado?', 'Qual o limite que não cruza, e o que o faria cruzar?', 'O que diz a mãe dele quando ele não está?', 'Que música ele tem vergonha de gostar?', 'O que ele faz com as mãos quando está nervoso?', 'Qual a última vez que chorou, e por quê?'],
  sorteia(arr, n) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); },
  dicaCampo(k) { const d = this.DICAS_CAMPO.find(([re]) => re.test(k)); return d ? { t: d[1], f: d[2] } : null; },
  campo(f, re) { const x = (f.fields || []).find(c => re.test(c.k)); return x && x.v.trim() ? x.v : ''; },

  /* olha o elenco e sugere o que falta */
  sugestoesElenco(fichas, dispensadas = []) {
    const ps = fichas.filter(f => f.kind === 'personagem');
    const tem = p => ps.some(f => f.papel === p);
    const prot = ps.find(f => f.papel === 'protagonista');
    const out = [];
    const add = (id, titulo, texto, fonte, acao) => { if (!dispensadas.includes(id)) out.push({ id, titulo, texto, fonte, acao }); };
    if (!ps.length) add('primeiro', 'Comece por quem quer alguma coisa', 'Uma história anda quando alguém deseja algo e encontra resistência. Crie o protagonista respondendo às perguntas do guia.', 'Truby; McKee', { tipo: 'criar', papel: 'protagonista' });
    else if (!prot) add('prot', 'Quem é o protagonista?', 'Marque na ficha a função de cada personagem. O app usa isso para ver o que falta no elenco.', 'Truby', { tipo: 'marcar' });
    if (prot) {
      if (!this.campo(prot, /quer|desejo/i)) add('desejo', `O que ${prot.name} quer?`, 'Sem um desejo claro, o leitor não sabe para onde a história vai nem quando ela termina.', 'Truby, Anatomia de uma história', { tipo: 'ficha', id: prot.id });
      if (!this.campo(prot, /precisa|necessidade|mentira/i)) add('necessidade', `O que ${prot.name} precisa e não sabe?`, 'O arco interno nasce da distância entre o que ele quer e o que precisa. Pode ser que ele nunca aprenda, e isso também é final.', 'Truby; Weiland', { tipo: 'ficha', id: prot.id });
    }
    if (ps.length && !tem('oponente')) add('oponente', 'Falta um oponente à altura', 'O melhor oponente quer a mesma coisa que o protagonista e conhece a fraqueza dele. Não precisa ser vilão: pode ser alguém que ele ama.', 'Truby, Anatomia de uma história', { tipo: 'criar', papel: 'oponente' });
    if (ps.length >= 2 && !tem('camaleao')) add('camaleao', 'Alguém em quem não dá para confiar', 'Um personagem que muda de lado ou de cara deixa o leitor inseguro e põe dúvida nas relações.', 'Vogler: camaleão; Truby: falso aliado', { tipo: 'criar', papel: 'camaleao' });
    if (ps.length >= 2 && !tem('espelho')) add('espelho', 'Um espelho do protagonista', 'Alguém que enfrenta o mesmo problema e escolhe outro caminho. Mostra ao leitor o que o protagonista poderia virar.', 'Truby, Anatomia de uma história', { tipo: 'criar', papel: 'espelho' });
    if (ps.length >= 3 && !tem('mentor')) add('mentor', 'Quem ensina, mesmo sem querer?', 'O mentor dá algo de que o protagonista precisa. Pode ser falho, ausente, já morto, ou ensinar pelo mau exemplo.', 'Vogler, A jornada do escritor', { tipo: 'criar', papel: 'mentor' });
    if (ps.length >= 4 && !tem('picaro')) add('picaro', 'Respiro de humor', 'Um pícaro alivia a tensão e mostra o lado ridículo do que parece grave.', 'Vogler, A jornada do escritor', { tipo: 'criar', papel: 'picaro' });
    const semFerida = ps.filter(f => f.papel && f.papel !== 'picaro' && !this.campo(f, /ferida|fantasma|passado/i));
    if (semFerida.length >= 2) add('feridas', 'Personagens sem passado', `${semFerida.slice(0, 3).map(f => f.name).join(', ')} ainda não têm ferida. O que aconteceu antes do livro explica o que eles fazem dentro dele.`, 'Truby: o fantasma', { tipo: 'ficha', id: semFerida[0].id });
    return out.slice(0, 4);
  },

  /* checagem do quadro de enredo (sem IA) */
  checarEnredo(cards, links, fichas) {
    const out = [];
    const sem = cards.filter(c => !links.some(l => l.from === c.id || l.to === c.id));
    if (!cards.length) out.push(['Quadro vazio', 'Comece por uma estrutura, por uma situação ou por um card solto. Nada aqui é obrigatório.', 'oficina']);
    if (cards.length > 3 && sem.length > cards.length / 2) out.push(['Muitos cards soltos', `${sem.length} cards sem ligação. O que causou cada um? Ligar com "Causa e efeito" mostra se a trama anda por consequência ou por acaso.`, 'Aristóteles: um acontecimento deve nascer do anterior']);
    const molde = cards.filter(c => c.guia);
    if (molde.length) out.push(['Etapas do molde em aberto', `${molde.length} cards ainda estão com a pergunta da estrutura. Responda, apague ou mude de lugar; a estrutura é um mapa, não um trilho.`, 'Vogler']);
    const prot = fichas.find(f => f.papel === 'protagonista');
    if (prot && !cards.some(c => c.fichaId === prot.id)) out.push(['Protagonista fora do quadro', `${prot.name} não aparece no quadro. Traga a ficha e ligue às cenas em que ele decide algo.`, 'oficina']);
    const opo = fichas.filter(f => f.papel === 'oponente');
    if (prot && opo.length && !links.some(l => { const a = cards.find(c => c.id === l.from), b = cards.find(c => c.id === l.to); const ids = [a?.fichaId, b?.fichaId]; return ids.includes(prot.id) && opo.some(o => ids.includes(o.id)); })) out.push(['Protagonista e oponente sem ligação', 'Que relação os une? Quanto mais perto, mais o conflito dói.', 'Truby']);
    const txt = cards.map(c => (c.title + ' ' + c.text).toLowerCase()).join(' ');
    if (cards.length > 5 && !/final|fim|clímax|climax|resolu|desfecho|nocaute|depois/.test(txt)) out.push(['Sem final à vista', 'Saber o final, mesmo que mude depois, dá direção às escolhas do meio.', 'Poe: começar pelo efeito; Dan Wells: comece pela resolução']);
    return out;
  }
};
