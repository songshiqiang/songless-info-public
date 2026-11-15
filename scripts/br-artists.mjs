// Brazilian artists whose best-known songs join the answer pool. iTunes lists an
// artist's songs roughly by popularity, so each artist's first `quota` songs become
// answers and the next ones only guess suggestions. Names are spelled as in the
// Brazilian iTunes Store, with `_` for a space inside a name.
// The tiers go from household names to the long tail of one-decade acts.
export const BR_TIERS = [
  [
    12,
    'Legião_Urbana Titãs Os_Paralamas_do_Sucesso Barão_Vermelho Cazuza Roberto_Carlos Tim_Maia Jorge_Ben_Jor Chico_Buarque Caetano_Veloso Gilberto_Gil Djavan Milton_Nascimento Gal_Costa Maria_Bethânia Elis_Regina Zeca_Pagodinho Alcione Martinho_da_Vila Fundo_de_Quintal Exaltasamba Raça_Negra Ivete_Sangalo Daniela_Mercury Chitãozinho_&_Xororó Leandro_&_Leonardo Zezé_Di_Camargo_&_Luciano Bruno_&_Marrone Marília_Mendonça Henrique_&_Juliano Jorge_&_Mateus Luan_Santana Gusttavo_Lima Anitta Ludmilla Racionais_MC\'s Charlie_Brown_Jr. Cidade_Negra Skank Jota_Quest Capital_Inicial Marisa_Monte Cássia_Eller Seu_Jorge Michel_Teló Wesley_Safadão'
  ],
  [
    5,
    'Kid_Abelha Blitz RPM Ultraje_a_Rigor Engenheiros_do_Hawaii Lobão Ira! Biquini_Cavadão Léo_Jaime Raimundos Nação_Zumbi Los_Hermanos Pitty Pato_Fu Detonautas CPM_22 Planet_Hemp O_Rappa Natiruts Nando_Reis Ana_Carolina Lenine Adriana_Calcanhotto Vanessa_da_Mata Maria_Gadú Tribalistas Arnaldo_Antunes Carlinhos_Brown Raul_Seixas Gonzaguinha Chico_Science Mamonas_Assassinas Belchior Beth_Carvalho Arlindo_Cruz Jorge_Aragão Só_Pra_Contrariar Art_Popular Soweto Belo Péricles Thiaguinho Turma_do_Pagode Sorriso_Maroto Grupo_Menos_É_Mais Ferrugem Dilsinho Mumuzinho Pixote Negritude_Junior Aviões_do_Forró Calcinha_Preta Banda_Calypso Terra_Samba Timbalada Olodum Banda_Eva Claudia_Leitte Asa_de_Águia Cheiro_de_Amor Babado_Novo Netinho Matheus_&_Kauan Zé_Neto_&_Cristiano Maiara_&_Maraísa Simone_&_Simaria Cristiano_Araújo Victor_&_Leo Chico_Rey_&_Paraná Milionário_&_José_Rico João_Mineiro_&_Marciano Roberta_Miranda Almir_Sater Rio_Negro_&_Solimões João_Bosco_&_Vinícius Marcos_&_Belutti Fernando_&_Sorocaba Marcelo_D2 Criolo Emicida MV_Bill MC_Kevinho MC_Don_Juan MC_Hariel MC_Cabelinho MC_Livinho Lexa Pocah Valesca_Popozuda Pabllo_Vittar Luísa_Sonza Iza'
  ],
  [
    2,
    'Metrô Radio_Taxi Sérgio_Sampaio Luiz_Gonzaga Dominguinhos Jackson_do_Pandeiro Bezerra_da_Silva Elba_Ramalho Amelinha Alceu_Valença Cavaleiros_do_Forró Frank_Aguiar Amado_Batista Molejo Grupo_Sensação Os_Travessos Bom_Gosto Grupo_Raça Katinguelê Hugo_&_Guilherme Edson_&_Hudson César_Menotti_&_Fabiano Tião_Carreiro_&_Pardinho Tonico_&_Tinoco Pena_Branca_&_Xavantinho Alok Vintage_Culture DENNIS DJ_Marlboro Tropkillaz Cat_Dealers BK\' Filipe_Ret Djonga Rincon_Sapiência Rashid Projota Hungria_Hip_Hop Tribo_da_Periferia Camisa_de_Vênus Heróis_da_Resistência Zélia_Duncan Fagner Ney_Matogrosso Roupa_Nova Banda_Cheiro_de_Amor Grupo_Revelação'
  ]
];

// Artists whose songs can't be newer than this. The store often dates old songs by
// their reissue, which would put a 1985 song by someone long gone in the 2010s.
export const BR_LAST_YEAR = {
  'Elis Regina': 1982,
  'Jackson do Pandeiro': 1982,
  'Luiz Gonzaga': 1989,
  'Raul Seixas': 1989,
  Cazuza: 1990,
  'Milionário & José Rico': 1991,
  Gonzaguinha: 1991,
  'Sérgio Sampaio': 1994,
  'Tonico & Tinoco': 1994,
  'Renato Russo': 1996,
  'Legião Urbana': 1996,
  'Mamonas Assassinas': 1996,
  'João Mineiro & Marciano': 1996,
  'Chico Science': 1997,
  'Tim Maia': 1998,
  'Leandro & Leonardo': 1998,
  'Pena Branca & Xavantinho': 2010,
  'Amado Batista': 2012,
  'Cristiano Araújo': 2015,
  'Chico Rey & Paraná': 2017,
  'Marília Mendonça': 2021
};
