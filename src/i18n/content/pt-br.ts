import { CONTACT_EMAIL } from '../../data/site';
import { library } from '../../data/songs';
import type { Content } from './en';

const n = (x: number) => x.toLocaleString('pt-BR');
const mail = `<a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`;
const topArtists = library.topArtists.slice(0, 5).map(([a]) => a);

const pt: Content = {
  layout: {
    nav: { daily: 'Desafio Diário', unlimited: 'Unlimited', party: 'Party' },
    mainNav: 'Principal',
    siteNav: 'Site',
    language: 'Idioma',
    coffee: 'Me pague um café',
    ogAlt: 'Songless: adivinhe a música em um segundo',
    tagline: 'Um jogo diário e grátis de adivinhar músicas',
    about: 'Sobre nós',
    contact: 'Contato',
    privacy: 'Política de Privacidade',
    terms: 'Termos de Serviço',
    credit: 'Prévias das músicas cortesia do Apple Music'
  },

  home: {
    title: 'Songless: Jogo de Adivinhar Músicas',
    description: 'Jogue Songless, o jogo diário e grátis de adivinhar músicas. Acerte cinco sucessos por trechos curtos todos os dias, jogue o Songless Unlimited ou desafie seus amigos.',
    howToName: 'Como jogar Songless',
    howTo: [
      'Toque em play para ouvir um trecho de um segundo da música.',
      'Digite o título e escolha a música nas sugestões, ou pule para ouvir um trecho mais longo.',
      'Termine as cinco músicas do Desafio Diário para receber sua pontuação de até 500.',
      'Compartilhe seu resultado sem spoilers e volte amanhã para um novo desafio.'
    ],
    loading: 'Carregando o desafio de hoje…',
    aria: 'Sobre o Songless',
    h1: 'Songless: Jogo de Adivinhar Músicas',
    tagline: 'Um segundo para começar.',
    lead: 'Cinco sucessos dos anos 80 até hoje. Cada música começa com um trecho de um segundo, e cada pulo dá um pouco mais. Quanto menos segundos você precisar, mais pontos faz.',
    meta: 'Novo desafio todo dia às 00:00 UTC · Sem cadastro · <a href="/unlimited">Jogar Songless Unlimited</a>',
    modesTitle: 'Modos de jogo',
    modes: [
      { tag: 'Diário', title: 'Desafio Diário', body: 'Cinco sucessos dos anos 80 até hoje, novos todo dia. Escolha um país e jogue o mesmo desafio que todo mundo.' },
      { tag: 'Unlimited', title: 'Songless Unlimited', body: 'Adivinhe quantas músicas quiser. Cada resposta certa soma à sua pontuação total.' },
      { tag: 'Com amigos', title: 'Songless Party', body: 'Todo mundo ouve o mesmo trecho, e quem acertar primeiro pontua. Crie uma sala e jogue ao vivo com até 10 amigos.' }
    ],
    howTitle: 'Como jogar Songless',
    steps: [
      { num: '1s', title: 'Ouça', body: 'Cada música começa com um trecho de um segundo tirado de qualquer parte, nem sempre da introdução.' },
      { num: '+2s', title: 'Palpite ou estique', body: 'Digite o título ou pule para ouvir mais: 1, 3, 6 e depois 12 segundos. Um palpite errado também estica o trecho.' },
      { num: '100', title: 'Pontue e compartilhe', body: 'Até 100 pontos por música. Termine as cinco e compartilhe seu desafio sem dar spoiler.' }
    ],
    guide: `
    <h3>As regras do Desafio Diário</h3>
    <p>Todo dia às 00:00 UTC um novo Desafio Diário é liberado. Ele tem cinco sucessos dos anos 1980 até hoje, e todo mundo que escolhe o mesmo país joga as mesmas cinco músicas naquele dia.</p>
    <ol>
      <li><strong>Toque em play.</strong> Você ouve um segundo da música. O trecho pode vir de qualquer parte da faixa, não só da introdução.</li>
      <li><strong>Palpite ou pule.</strong> Comece a digitar um título ou artista e escolha a música nas sugestões. Não tem certeza? Pule para liberar um trecho mais longo.</li>
      <li><strong>Siga em frente.</strong> Quando acertar a música ou os trechos acabarem, passe para a próxima.</li>
      <li><strong>Compartilhe.</strong> Depois da quinta música, você recebe sua pontuação de até 500 e uma grade sem spoilers para compartilhar.</li>
    </ol>
    <h3>Duração dos trechos e pontuação</h3>
    <p>Cada música dá quatro tentativas. Pular e errar gastam uma tentativa e liberam o próximo trecho.</p>
    <table>
      <thead><tr><th>Tentativa</th><th>Duração do trecho</th><th>Pontos se acertar</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>1 segundo</td><td>100</td></tr>
        <tr><td>2</td><td>3 segundos</td><td>70</td></tr>
        <tr><td>3</td><td>6 segundos</td><td>40</td></tr>
        <tr><td>4</td><td>12 segundos</td><td>20</td></tr>
      </tbody>
    </table>
    <p>A maior pontuação possível é 500: todas as músicas acertadas no primeiro trecho de um segundo.</p>
    <h3>Dicas para adivinhar mais rápido</h3>
    <ul>
      <li><strong>Situe a época primeiro.</strong> A produção entrega a década rapidamente: teclados sintetizados apontam para os anos 80, guitarras grunge para os 90 e hi-hats de trap para os anos 2010 em diante.</li>
      <li><strong>Ouça o instrumento, não as palavras.</strong> Um segundo raramente tem um verso inteiro, mas um riff marcante, uma virada de bateria ou o timbre da voz costumam entregar a música.</li>
      <li><strong>Busque pelo artista.</strong> A caixa de palpite também encontra nomes de artistas. Se você reconheceu a voz, digite o artista e veja as músicas.</li>
      <li><strong>Teve uma ideia? Palpite.</strong> Errar e pular custam o mesmo, então sempre vale a pena digitar um palpite.</li>
      <li><strong>Pratique no Unlimited.</strong> Jogar uma década ou gênero de cada vez no <a href="/unlimited">Songless Unlimited</a> é o jeito mais rápido de treinar o ouvido.</li>
    </ul>`,
    faqTitle: 'Perguntas frequentes sobre o Songless',
    faq: [
      { q: 'O que é o Songless?', a: 'Songless é um jogo de adivinhar músicas: você ouve um trecho minúsculo e tenta acertar a música no menor número de segundos possível. No songless.info, você pode jogar de graça um Desafio Diário com cinco sucessos dos anos 1980 até hoje ou continuar no Songless Unlimited.' },
      { q: 'Quando sai o novo desafio do Songless?', a: 'Um novo Desafio Diário é liberado todo dia às 00:00 UTC. Todo mundo que escolhe o mesmo país recebe as mesmas cinco músicas, então dá para comparar pontuações com os amigos.' },
      { q: 'Posso jogar o Desafio Diário com músicas de outros países?', a: 'Sim. Escolha EUA, Brasil, Rússia ou Chinês acima do player. Cada opção tem suas próprias cinco músicas por dia, e suas pontuações e dias seguidos são guardados separadamente.' },
      { q: 'Como funciona a pontuação?', a: 'Cada música começa com um trecho de 1 segundo. Pular ou errar estica para 3, 6 e depois 12 segundos. Você faz 100, 70, 40 ou 20 pontos dependendo do trecho em que acertar, com máximo de 500 por desafio.' },
      { q: 'Existe um modo Songless Unlimited?', a: 'Sim. O Songless Unlimited deixa você adivinhar uma música atrás da outra, sem limite diário. Escolha as décadas e os gêneros que preferir e veja até onde vai sua pontuação total.' },
      { q: 'Preciso de uma conta?', a: 'Não. O Songless é grátis e não precisa de cadastro. Suas pontuações e estatísticas ficam salvas no navegador.' },
      { q: 'De onde vêm os trechos das músicas?', a: 'Os trechos são prévias oficiais de 30 segundos fornecidas pelo Apple Music. Nunca hospedamos o áudio, e cada música revelada tem um link para a faixa completa.' }
    ],
    faqFoot: 'Vai jogar com amigos? Veja <a href="/party#how-to-play">como funciona o Songless Party</a>.'
  },

  unlimited: {
    title: 'Songless Unlimited: Adivinhe a Música com um Trecho de 1 Segundo | Songless',
    description: `Jogue o Songless Unlimited de graça. Adivinhe a música com um trecho de 1 segundo, escolha entre ${n(library.answers)} sucessos por década, gênero ou país e aumente sua pontuação total.`,
    name: 'Songless Unlimited',
    loading: 'Carregando o Songless Unlimited…',
    aria: 'Introdução',
    h1: 'Songless Unlimited: Adivinhe a Música em Um Segundo',
    tagline: 'Sem limite diário. Continue adivinhando.',
    lead: 'Adivinhe a música com um trecho de um segundo e continue. Cada acerto soma à sua pontuação total e à contagem de músicas.',
    how: `
    <h2 id="how-to-play">Como jogar Songless Unlimited</h2>
    <ol>
      <li><strong>Toque em play.</strong> Você ouve um trecho de um segundo de um sucesso aleatório.</li>
      <li><strong>Palpite ou pule.</strong> Digite um título ou artista e escolha a música nas sugestões. Pular ou errar libera um trecho mais longo: 1, 3, 6 e depois 12 segundos.</li>
      <li><strong>Aumente seu total.</strong> Cada música que você acerta soma à pontuação total e à contagem de músicas.</li>
      <li><strong>Errou? Siga em frente.</strong> Se ainda não souber depois do trecho de 12 segundos, a música é revelada e você não perde nada.</li>
      <li><strong>Salve sua pontuação.</strong> Use o botão de salvar a qualquer momento para entrar no ranking.</li>
    </ol>
    <h3>Pontuação</h3>
    <p>Cada música pontua como no Desafio Diário: <strong>100 pontos</strong> no trecho de 1 segundo, <strong>70</strong> em 3 segundos, <strong>40</strong> em 6 segundos e <strong>20</strong> em 12 segundos. O ranking ordena os jogadores por pontos totais e depois por músicas acertadas.</p>
    <h2 id="library">O que tem no Songless Unlimited</h2>
    <p><strong>${n(library.answers)} músicas</strong> de ${n(library.artists)} créditos de artistas podem aparecer como resposta, de ${library.firstYear} a ${library.lastYear}. A caixa de palpite conhece ${n(library.suggestions)} músicas, então as sugestões não entregam a resposta. As músicas do Brasil tocam por padrão. Use o filtro para adicionar os EUA, a Rússia ou a biblioteca em chinês.</p>`,
    stats: { decade: 'Década', genre: 'Gênero', chart: 'Parada', artist: 'Artista', songs: 'Músicas' },
    tips: `
    <h2 id="tips">Como ficar melhor em adivinhar músicas</h2>
    <ol>
      <li><strong>Identifique primeiro o tipo de gravação.</strong> Antes de procurar um título, pergunte-se o que ouviu: uma bateria eletrônica, uma guitarra distorcida, um coro de vocais de apoio. Só isso já pode descartar boa parte da biblioteca.</li>
      <li><strong>Depois, situe a década.</strong> Muitas vezes os ouvintes conseguem julgar a época de uma música a partir de um trecho curto demais para identificá-la. Confie nesse instinto e comece a busca por aí.</li>
      <li><strong>Treine um som de cada vez.</strong> Use o filtro para jogar uma década, gênero ou país até conhecer o som, depois abra as opções.</li>
      <li><strong>Busque pelo artista.</strong> Se você conhece a voz, mas não o título, digite o artista e veja as músicas.</li>
      <li><strong>Teve uma ideia? Palpite.</strong> Um palpite errado custa o mesmo que pular, então sempre vale a pena digitar.</li>
    </ol>`,
    faqTitle: 'Perguntas frequentes sobre o Songless Unlimited',
    faq: [
      { q: 'Existe um Songless ilimitado?', a: 'Sim. O Songless Unlimited desta página não tem limite diário. Ele toca sucessos aleatórios por quanto tempo você quiser, e errar uma música não custa nada.' },
      { q: 'O Songless Unlimited é grátis?', a: 'Sim. Você joga de graça no navegador, sem conta e sem instalar nada. Só escolhe um nome e uma senha se quiser salvar sua pontuação no ranking.' },
      { q: 'Existe um jogo de adivinhar música com trecho de 1 segundo?', a: 'Sim, este. Toda música do Songless Unlimited começa com um trecho de 1 segundo e abre para 3, 6 e 12 segundos se você pular ou errar.' },
      { q: 'Onde posso adivinhar músicas online de graça?', a: 'Aqui mesmo. O Songless tem três modos grátis: Unlimited para jogar sozinho sem fim, o Desafio Diário com cinco músicas fixas por dia e o Songless Party para salas ao vivo com amigos.' },
      { q: 'Quais músicas estão no Songless Unlimited?', a: `${n(library.answers)} sucessos de ${library.firstYear} a ${library.lastYear} podem aparecer como resposta: sucessos de fim de ano da Billboard dos EUA, além de sucessos do Brasil, da Rússia e das paradas em chinês. As músicas do Brasil tocam por padrão, e o filtro adiciona as outras.` },
      { q: 'Quais artistas estão no Songless?', a: `${n(library.artists)} créditos de artistas aparecem entre as respostas. Os artistas com mais músicas são ${topArtists.slice(0, -1).join(', ')} e ${topArtists.at(-1)}.` },
      { q: 'Qual a diferença entre o Songless Unlimited e o Desafio Diário?', a: 'O Desafio Diário tem cinco músicas fixas por dia para cada país, iguais para todo mundo. O Songless Unlimited escolhe músicas aleatórias por quanto tempo você quiser.' },
      { q: 'O que acontece se eu errar uma música no Unlimited?', a: 'Uma música que você não acerta depois dos quatro trechos (1, 3, 6 e 12 segundos) não dá pontos, e a próxima já fica pronta. Sua pontuação total e a contagem de músicas continuam iguais.' },
      { q: 'Posso jogar só uma década ou gênero?', a: 'Sim. Toque no botão de filtro acima do player para escolher décadas (dos anos 80 aos anos 2020), gêneros como pop, rock, hip-hop ou country, e de qual país são os sucessos: paradas Billboard dos EUA, Brasil, Rússia ou sucessos em chinês da China continental, Hong Kong e Taiwan. Mudar os filtros mantém seus totais.' },
      { q: 'O Songless é parecido com o Heardle?', a: 'Eles compartilham uma ideia: um trecho curto que cresce até você acertar a música. O Heardle dava a todos uma música por dia, e o Spotify encerrou o original em maio de 2023. O Songless Unlimited não tem limite diário, e cada música tem quatro trechos em vez de seis palpites.' },
      { q: 'O songless.info é o Songless oficial?', a: 'Outros jogos também usam o nome Songless. O songless.info é um site independente, feito por fãs, e não tem ligação com nenhum deles.' }
    ],
    faqFoot: 'Quer um desafio fixo para comparar com os amigos? <a href="/">Jogue o Desafio Diário de hoje</a>.',
    deep: `
    <h2 id="one-second">O que cabe em um segundo de música</h2>
    <p>Um segundo basta para soar como uma gravação específica, mas raramente basta para uma melodia. A 120 batidas por minuto, ele cobre dois tempos: algumas notas e talvez uma sílaba. Então como alguém consegue acertar uma música assim?</p>
    <p>Em 1999, E. Glenn Schellenberg, Paul Iverson e Margaret McKinnon testaram trechos bem mais curtos. Estudantes ouviram excertos de cinco sucessos recentes, incluindo "Macarena" e "One Sweet Day", e os associaram a títulos e artistas. Com 200 milissegundos, 19 de 20 ouvintes superaram o acaso. Com 100 milissegundos, o grupo ainda superou o acaso, embora a média tenha caído de 3,45 músicas em cinco para 1,70.</p>
    <p>Trechos tão curtos não comportam uma melodia nem uma palavra. Quando os trechos de 100 milissegundos foram tocados de trás para frente, ou quando o som acima de 1.000 Hz foi filtrado, os resultados caíram ao nível do acaso. Remover as frequências graves não fez diferença. Os autores concluíram que os ouvintes usavam principalmente o timbre: o som geral da gravação, mais do que a altura das notas.</p>
    <p>Aquele teste era bem mais fácil que este jogo. Os ouvintes tinham cinco músicas para escolher, podiam repetir cada trecho e tinham acabado de ouvir excertos mais longos das mesmas músicas. Os autores dizem que essas condições inflaram as pontuações. Aqui, ninguém lhe entrega uma lista de cinco.</p>
    <p>O estudo "Plink", de Carol Krumhansl (2010), usou trechos de músicas populares gravadas depois de 1960. Universitários acertaram artista e título mais de 25% das vezes com 400 milissegundos. Quando não reconheciam um trecho de 300 milissegundos, ainda conseguiam julgar seu estilo, emoção e década. Você pode saber que tipo de música é antes de saber qual é, e é nisso que as dicas acima se baseiam.</p>
    <h2 id="history">De Name That Tune ao Songless</h2>
    <table>
      <thead><tr><th>Ano</th><th>O que mudou</th></tr></thead>
      <tbody>
        <tr><td>1948</td><td><em>Stop the Music</em> estreia no rádio americano. Uma orquestra toca uma melodia, e convidados do estúdio e pessoas contatadas por telefone tentam acertá-la.</td></tr>
        <tr><td>1952</td><td><em>Name That Tune</em>, de Harry e Roberta Semple Salter, estreia na rádio NBC e chega à TV em 1953. Na rodada Bid-a-Note, os participantes apostam de quantas notas precisam.</td></tr>
        <tr><td>2002</td><td>O Shazam é lançado no Reino Unido. Você disca 2580, aproxima o telefone da música e recebe a resposta por SMS. Agora é uma máquina que joga.</td></tr>
        <tr><td>2022</td><td>O Heardle leva o formato do Wordle à música: uma música por dia, começando em um segundo. O Spotify o compra em julho daquele ano.</td></tr>
        <tr><td>2023</td><td>O Spotify encerra o Heardle em maio, deixando o formato para jogos independentes.</td></tr>
      </tbody>
    </table>
    <p>As gravações seguem o mesmo caminho. Um estudo de 303 singles do top 10 dos EUA de 1986 a 2015 descobriu que as introduções encolheram de mais de 20 segundos em meados dos anos 1980 para cerca de 5, e que o título passou a chegar cerca de 18% mais cedo depois do início da letra.</p>
    <h2 id="terms">Termos do jogo</h2>
    <dl class="terms">
      <div><dt>Trecho</dt><dd>A parte da música que você ouve. Aqui, tem 1, 3, 6 ou 12 segundos.</dd></div>
      <div><dt>Timbre</dt><dd>O caráter de um som, o que diferencia um piano de um trompete tocando a mesma nota.</dd></div>
      <div><dt>Gancho</dt><dd>A parte curta e marcante de uma música, que fica na memória, muitas vezes o verso do título.</dd></div>
      <div><dt>Impressão digital de áudio</dt><dd>Uma assinatura digital compacta de uma gravação. Apps como o Shazam comparam essas assinaturas para identificar músicas.</dd></div>
    </dl>`,
    sourcesTitle: 'Fontes'
  },

  party: {
    title: 'Songless Party: Jogo Multijogador de Adivinhar Músicas com Amigos | Songless',
    description: 'Jogue Songless Party de graça com os amigos: todo mundo ouve o mesmo trecho e quem acertar a música primeiro pontua. Crie uma sala, compartilhe o código e jogue ao vivo.',
    name: 'Songless Party',
    loading: 'Carregando o Songless Party…',
    aria: 'Introdução',
    h1: 'Songless Party',
    tagline: 'O mesmo trecho. O ouvido mais rápido vence.',
    lead: 'O jogo multijogador de adivinhar músicas. Todo mundo ouve o mesmo trecho ao mesmo tempo, e quem acertar a música primeiro pontua. Crie uma sala acima e mande o código para os amigos.',
    meta: 'Grátis · Sem cadastro · Até 10 jogadores por sala',
    guide: `
    <h2 id="how-to-play">Como jogar Songless Party</h2>
    <ol>
      <li><strong>Abra uma sala.</strong> Escolha um nome e um instrumento, toque em Criar uma sala e compartilhe o código de quatro letras ou o link de convite.</li>
      <li><strong>Comece a partida.</strong> Com dois ou mais jogadores sentados, o anfitrião começa. Depois de uma contagem regressiva de 3 segundos, a primeira música toca.</li>
      <li><strong>Responda rápido.</strong> Todo mundo ouve o mesmo trecho de 1 segundo. Digite a música e envie o mais rápido possível. A primeira resposta certa leva a música.</li>
      <li><strong>Trechos mais longos.</strong> Se ninguém acertar em até 10 segundos depois do fim do trecho, ele cresce para 3 segundos, depois 6, depois 12. Quanto mais longo o trecho, menos pontos.</li>
      <li><strong>Palpite errado?</strong> Você fica bloqueado por 2 segundos e depois pode tentar de novo.</li>
      <li><strong>A maior pontuação vence.</strong> Depois da última música, os resultados aparecem por alguns segundos e todo mundo volta ao lobby, pronto para a próxima sala.</li>
    </ol>
    <h2>Pontuação</h2>
    <ul>
      <li><strong>100 pontos</strong> no trecho de 1 segundo, <strong>70</strong> em 3 segundos, <strong>40</strong> em 6 segundos e <strong>20</strong> em 12 segundos.</li>
      <li>Só a primeira resposta certa pontua. Se ninguém acertar, a música é revelada e a próxima começa.</li>
    </ul>
    <h2>Configurações da sala</h2>
    <p>O anfitrião pode alterar isto na sala antes de começar:</p>
    <ul>
      <li><strong>Músicas:</strong> quantas músicas por partida (de 5 a 20, padrão 10).</li>
      <li><strong>Lugares:</strong> até 10 jogadores por sala.</li>
    </ul>
    <h2>Dicas para vencer</h2>
    <ul>
      <li><strong>Digite algumas letras e escolha.</strong> A lista de sugestões é mais rápida que digitar o título inteiro. Pratique com o <a href="/unlimited">Songless Unlimited</a>.</li>
      <li><strong>Não chute à toa.</strong> Um palpite errado bloqueia você por 2 segundos, que podem ser o momento em que outra pessoa acerta.</li>
      <li><strong>Arrisque no primeiro segundo.</strong> 100 pontos pelo trecho de 1 segundo valem cinco respostas de 12 segundos.</li>
    </ul>`,
    faqTitle: 'Perguntas frequentes sobre o Songless Party',
    faq: [
      { q: 'O que é o Songless Party?', a: 'O Songless Party é o modo multijogador do Songless. Os amigos dividem uma sala, e todo mundo ouve o mesmo trecho ao mesmo tempo. Quem acertar a música primeiro pontua, e a maior pontuação depois da última música vence.' },
      { q: 'Como jogo Songless Party com os amigos?', a: 'Digite seu nome, toque em Criar uma sala e mande para os amigos o código de quatro letras ou o link de convite. Eles digitam o código em Entrar com um código, ou abrem o link, e se sentam. Com pelo menos dois jogadores, o anfitrião começa a partida.' },
      { q: 'Qual é a duração dos trechos?', a: 'Toda música começa com um trecho de 1 segundo. Se ninguém acertar em até 10 segundos depois do fim do trecho, ele cresce para 3 segundos, depois 6, depois 12, as mesmas durações do Desafio Diário.' },
      { q: 'Como funciona a pontuação?', a: 'Só a primeira resposta certa pontua: 100 pontos no trecho de 1 segundo, 70 em 3 segundos, 40 em 6 segundos e 20 em 12 segundos. Um palpite errado não tira pontos, mas bloqueia você por 2 segundos.' },
      { q: 'Quantas músicas tem uma partida?', a: 'Dez por padrão. O anfitrião pode escolher de 5 a 20 músicas antes de começar. Depois da última música, os resultados aparecem por alguns segundos e todo mundo volta ao lobby.' },
      { q: 'O Songless Party é grátis? Preciso de uma conta?', a: 'É grátis e não tem cadastro. As salas fecham no fim de cada partida ou depois de 30 minutos sem ninguém.' }
    ],
    faqFoot: 'Jogando sozinho? <a href="/">Jogue o Desafio Diário de hoje</a> ou o <a href="/unlimited">Songless Unlimited</a>.'
  },

  about: {
    title: 'Sobre o Songless: um jogo grátis de adivinhar músicas | Songless',
    description: 'O Songless.info é um jogo grátis e independente de adivinhar músicas: ouça um trecho curto de um sucesso e acerte no menor tempo possível. Saiba quem faz e como funciona.',
    body: `
    <h1>Sobre o Songless</h1>
    <p class="lead">O Songless.info é um jogo grátis de adivinhar músicas. Você ouve um trecho curto de um sucesso, e quanto menos segundos precisar para acertar, mais pontos faz.</p>
    <h2>O que você pode jogar</h2>
    <ul>
      <li><strong><a href="/">Desafio Diário</a></strong>: cinco músicas novas todo dia, iguais para todos os jogadores.</li>
      <li><strong><a href="/unlimited">Unlimited</a></strong>: jogue quantas músicas quiser, com filtros por década, gênero ou país da parada, e publique sua melhor sequência no ranking.</li>
      <li><strong><a href="/party">Party</a></strong>: uma sala privada em que os amigos disputam o mesmo trecho.</li>
    </ul>
    <h2>De onde vêm as músicas</h2>
    <p>A biblioteca é feita a partir de paradas de sucessos de fim de ano, de 1980 até hoje. Os trechos de áudio são as prévias de 30 segundos que a Apple publica pela iTunes Search API, transmitidas diretamente da Apple. Não hospedamos nem vendemos música, e cada canção pertence a seus artistas e detentores de direitos.</p>
    <h2>Um site independente</h2>
    <p>"Songless" é o nome de um estilo de jogo de adivinhação, e o songless.info é uma versão independente feita por fãs. Não temos afiliação, endosso ou ligação com a Apple, gravadoras, artistas ou outros jogos de adivinhar músicas.</p>
    <h2>Como o site se paga</h2>
    <p>O Songless é grátis e não precisa de conta. Não há anúncios. Se você gosta do jogo, pode ajudar com os custos de hospedagem pelo botão Buy me a coffee no topo de cada página.</p>
    <h2>Fale conosco</h2>
    <p>Encontrou uma resposta errada, um trecho com problema ou tem uma ideia? Escreva para ${mail} ou veja a <a href="/contact">página de contato</a>.</p>`
  },

  contact: {
    title: 'Contato | Songless',
    description: 'Fale com a equipe do Songless: informe uma resposta errada ou um trecho com problema, pergunte sobre seu nome no ranking ou envie comentários e ideias.',
    body: `
    <h1>Contato</h1>
    <p class="lead">A melhor forma de falar conosco é por e-mail: ${mail}. Lemos todas as mensagens e costumamos responder em poucos dias.</p>
    <h2>O que incluir</h2>
    <ul>
      <li><strong>Resposta errada ou trecho com problema:</strong> o modo em que você estava jogando (Diário, Unlimited ou Party), a data e o título e artista da música, se souber.</li>
      <li><strong>Seu registro no ranking:</strong> o nome mostrado no ranking e o que você quer alterar ou remover.</li>
      <li><strong>Um bug:</strong> seu navegador e dispositivo, e o que aconteceu na tela.</li>
      <li><strong>Pedidos de privacidade:</strong> veja nossa <a href="/privacy">Política de Privacidade</a> para saber o que guardamos.</li>
    </ul>
    <h2>Direitos autorais e música</h2>
    <p>Os trechos são prévias oficiais transmitidas pela Apple, e toda a música pertence a seus detentores de direitos. Se você detém os direitos e quer remover uma música do jogo, envie um e-mail com o título e o artista e nós a retiraremos.</p>`
  },

  legal: {
    updated: (date) => `Última atualização: ${date}`,
    note: 'Esta é uma tradução para facilitar a leitura. Em caso de divergência, vale a <a href="{en}">versão em inglês</a>.'
  },

  privacy: {
    title: 'Política de Privacidade | Songless',
    description: 'Como o songless.info trata seus dados: o que o jogo salva no navegador, o que o ranking armazena e quais serviços de análise e prévias de música o site usa.',
    h1: 'Política de Privacidade',
    body: `
    <p class="lead">O Songless (songless.info) não precisa de conta, e coletamos o mínimo possível. Esta página explica o que é salvo, onde e por quê.</p>
    <h2>Salvo no seu navegador</h2>
    <p>O jogo usa o armazenamento local do navegador para lembrar coisas no seu próprio dispositivo: histórico e estatísticas do Desafio Diário, sua melhor sequência no Unlimited, suas configurações (modo, som ligado ou desligado, filtros, idioma), seu ID de jogador do ranking, nome e avatar, e em qual sala do Party você está. Esses dados nunca saem do seu dispositivo, a menos que você escolha salvar uma pontuação no ranking. Você pode excluí-los a qualquer momento limpando os dados deste site no navegador.</p>
    <h2>O ranking do Unlimited</h2>
    <p>Se você salvar uma pontuação do Unlimited, armazenamos no nosso servidor: um ID de jogador aleatório criado pelo navegador, o apelido e o avatar emoji opcional que você escolher, sua pontuação, o número de músicas certas, o filtro usado e o horário. Tudo, exceto o ID de jogador, aparece publicamente no ranking. Também guardamos um hash com sal da sua senha, nunca a senha em si, e ele não é mostrado a ninguém. Não use seu nome real nem informações pessoais como apelido. Seu endereço IP é usado por apenas alguns segundos para impedir envios de spam e não é armazenado com seu registro.</p>
    <h2>Salas do Party</h2>
    <p>O nome que você digita em uma sala do Party é compartilhado com os outros jogadores daquela sala durante a partida. As salas são excluídas quando a partida termina, e não guardamos os nomes nem as pontuações depois disso.</p>
    <h2>Análises</h2>
    <p>Usamos uma instância própria do Umami para contar visitas e ver quais páginas e modos são usados. O Umami não usa cookies, não rastreia você em outros sites e informa apenas números anônimos e agregados, como visualizações de página, origens, país e tipo de dispositivo.</p>
    <h2>Prévias de música e outros serviços</h2>
    <ul>
      <li><strong>Apple:</strong> trechos e capas são transmitidos diretamente dos servidores da Apple (o serviço de prévias do iTunes), então a Apple recebe seu endereço IP e informações básicas do navegador quando um trecho toca. A política de privacidade da Apple se aplica a essas solicitações.</li>
      <li><strong>Cloudflare:</strong> o site, as salas do Party e o ranking funcionam na Cloudflare. A Cloudflare processa as solicitações (incluindo endereços IP) para entregar o site e protegê-lo contra abusos.</li>
      <li><strong>Google Fonts:</strong> as fontes são carregadas do Google, que recebe seu endereço IP quando elas são carregadas.</li>
    </ul>
    <h2>Crianças</h2>
    <p>O Songless é um jogo para o público em geral e não é voltado a crianças menores de 13 anos. Não coletamos intencionalmente informações pessoais de crianças.</p>
    <h2>Suas escolhas e direitos</h2>
    <p>Você mesmo pode limpar tudo o que está armazenado no navegador. Para alterar ou remover seu registro no ranking, ou para qualquer outra questão de privacidade, envie um e-mail para ${mail} com o apelido mostrado no ranking. Dependendo de onde você mora, você pode ter direito de acessar, corrigir ou excluir seus dados pessoais, e atenderemos a esses pedidos.</p>
    <h2>Alterações nesta política</h2>
    <p>Se mudarmos a forma como o site trata os dados, atualizaremos esta página e a data no topo.</p>`
  },

  terms: {
    title: 'Termos de Serviço | Songless',
    description: 'Os termos de uso do songless.info, o jogo grátis de adivinhar músicas: jogo limpo, nomes no ranking, direitos musicais e nossos limites de responsabilidade.',
    h1: 'Termos de Serviço',
    body: `
    <p class="lead">Ao usar o songless.info ("Songless", "o site", "nós"), você concorda com estes termos. Se não concordar, não use o site.</p>
    <h2>O jogo</h2>
    <p>O Songless é um jogo grátis de adivinhar músicas para entretenimento pessoal e não comercial. Não é preciso ter conta. Podemos alterar, pausar ou remover qualquer parte do jogo, incluindo modos, músicas e o ranking, a qualquer momento.</p>
    <h2>Jogo limpo e o ranking</h2>
    <ul>
      <li>Não use scripts, bots ou ferramentas automáticas para jogar ou enviar pontuações.</li>
      <li>Não tente quebrar, sobrecarregar ou contornar os limites ou a segurança do site.</li>
      <li>Nomes no ranking e no Party não podem ser ofensivos, de ódio ou sexuais, se passar por outra pessoa, nem incluir informações pessoais ou publicidade.</li>
    </ul>
    <p>Podemos editar ou remover qualquer nome ou pontuação, e bloquear quem violar estas regras, sem aviso.</p>
    <h2>Música e conteúdo</h2>
    <p>Trechos e capas são prévias oficiais transmitidas pela Apple e pertencem a seus artistas, gravadoras e outros detentores de direitos. Eles são oferecidos apenas para que você possa jogar, e você não pode baixá-los, copiá-los ou redistribuí-los. Títulos de músicas e nomes de artistas são usados apenas para identificar as músicas. O restante do site, incluindo design, código e texto, pertence ao Songless.</p>
    <p>Se você detém os direitos e quer remover uma música, envie um e-mail para ${mail}.</p>
    <h2>Site independente</h2>
    <p>O Songless.info é um site independente. Não é afiliado nem endossado pela Apple, por gravadoras ou artistas, nem por outros jogos de adivinhar músicas. Todas as marcas pertencem a seus donos.</p>
    <h2>Links de terceiros</h2>
    <p>O site pode ter links para outros sites, como o Apple Music e o Buy Me a Coffee. Não somos responsáveis pelo conteúdo, pelos produtos ou pelas práticas de privacidade desses terceiros.</p>
    <h2>Sem garantia</h2>
    <p>O site é oferecido "como está" e "conforme disponível". Não prometemos que estará sempre disponível, sem erros, nem que cada resposta ou posição em paradas esteja correta.</p>
    <h2>Limitação de responsabilidade</h2>
    <p>Na máxima extensão permitida por lei, o Songless não se responsabiliza por danos indiretos, incidentais ou consequentes, nem por perda de dados ou pontuações, decorrentes do uso do site.</p>
    <h2>Privacidade</h2>
    <p>Nossa <a href="/privacy">Política de Privacidade</a> explica quais dados o site usa e por quê.</p>
    <h2>Alterações</h2>
    <p>Podemos atualizar estes termos de tempos em tempos. A data no topo mostra a versão mais recente, e usar o site depois de uma alteração significa aceitar os novos termos.</p>
    <h2>Contato</h2>
    <p>Dúvidas sobre estes termos: ${mail}.</p>`
  },

  notFound: {
    title: 'Página não encontrada | Songless',
    description: 'Esta página não existe. Jogue o desafio de hoje do Songless.',
    h1: 'Esta página perdeu o ritmo',
    lead: 'Não encontramos esta página.',
    cta: 'Jogar o desafio de hoje'
  }
};

export default pt;
