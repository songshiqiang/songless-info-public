import type { Ui } from './en';

/** 1 песня, 2 песни, 5 песен. */
function plural(n: number, one: string, few: string, many: string) {
  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}
const secWord = (n: number) => plural(n, 'секунда', 'секунды', 'секунд');
const songWord = (n: number) => plural(n, 'песня', 'песни', 'песен');
const pointWord = (n: number) => plural(n, 'очко', 'очка', 'очков');
const playerWord = (n: number) => plural(n, 'игрок', 'игрока', 'игроков');

const ru: Ui = {
  charts: { US: 'США', BR: 'Бразилия', RU: 'Россия', ZH: 'Китайские' },
  genres: { Pop: 'Поп', Rock: 'Рок', 'Hip-Hop': 'Хип-хоп', 'R&B': 'R&B', Country: 'Кантри', Dance: 'Танцевальная', Latin: 'Латино' },
  decades: { '80s': '1980-е', '90s': '1990-е', '00s': '2000-е', '10s': '2010-е', '20s': '2020-е' },
  decadesShort: { '80s': '80-е', '90s': '90-е', '00s': '00-е', '10s': '10-е', '20s': '20-е' },
  allCountries: 'Все страны',
  allDecades: 'Все десятилетия',
  allGenres: 'Все жанры',

  seconds: (n) => `${n} ${secWord(n)}`,
  secondsShort: (n) => `${n} с`,
  songs: (n) => `${n} ${songWord(n)}`,
  points: (n) => `${n} ${pointWord(n)}`,
  pts: (n) => `${n} ${pointWord(n)}`,
  skip: (n) => `Пропустить (+${n} с)`,
  giveUp: 'Сдаться',
  close: 'Закрыть',
  cancel: 'Отмена',
  ok: 'ОК',
  copied: 'Скопировано!',
  listenApple: 'Слушать в Apple Music',
  solvedAt: (n) => `Угадано за ${n} с`,
  missed: 'Не угадано',
  best: 'Рекорд',
  nextSongPlain: 'Следующая песня',
  yourName: 'Ваше имя',

  daily: {
    loadError: 'Не удалось загрузить челлендж. Проверьте соединение и обновите страницу.',
    loading: 'Загружаем челлендж дня…',
    title: (date) => `Челлендж дня · ${date}`,
    archive: 'Архив',
    history: 'Моя история',
    scoreLine: (total, max) => `Счёт ${total} / ${max} · Новый челлендж в 00:00 UTC`,
    songOf: (i, n) => `Песня ${i} из ${n}`,
    solvedIn: (time, points) => `Угадано за ${time} · +${points} ${pointWord(points)}`,
    outOfClips: 'Фрагменты закончились · 0 очков',
    seeResults: 'Посмотреть результаты',
    nextSong: (i, n) => `Следующая песня (${i} из ${n})`,
    complete: (date) => `Челлендж ${date} пройден`,
    played: 'Сыграно',
    streak: 'Дней подряд',
    notDone: 'Ещё не наигрались?',
    keepGoing: 'Продолжайте в Songless Unlimited',
    shareTitle: 'Поделиться без спойлеров',
    savedHere: 'Сохранено в этом браузере ✓',
    saveHistory: 'Сохранить в историю',
    viewPast: 'Прошлые результаты',
    nextIn: (time) => `Следующий челлендж через ${time}`,
    playToday: 'Играть в челлендж дня'
  },

  history: {
    emptyTitle: 'Сохранённых дней пока нет',
    emptyBefore: 'Пройдите челлендж дня и нажмите ',
    emptyAfter: ' на экране результатов. Результаты хранятся только в этом браузере.',
    confirmDelete: 'Удалить этот день из истории?',
    days: 'Сохранено дней',
    average: 'Средний счёт',
    summary: (solved, songs) => `Угадано ${solved} из ${songs} · Хранится только в этом браузере`,
    open: 'Открыть этот челлендж',
    delete: 'Удалить'
  },

  shareImage: {
    open: 'Поделиться',
    share: 'Поделиться картинкой',
    save: 'Сохранить картинку',
    rank: (n) => `№${n} в рейтинге`,
    tagline: 'Угадай песню за одну секунду.'
  },

  unlimited: {
    loadError: 'Не удалось загрузить песни. Проверьте соединение и обновите страницу.',
    loading: 'Загружаем Songless Unlimited…',
    title: 'Songless Unlimited',
    filterLabel: (filter) => `Изменить фильтры песен: ${filter}`,
    leaderboard: 'Рейтинг',
    song: (n) => `Песня ${n}`,
    correct: (points) => `Верно · +${points} ${pointWord(points)}`,
    nextError: 'Не удалось загрузить следующую песню. Проверьте соединение и попробуйте снова.'
  },

  save: {
    button: 'Сохранить счёт в рейтинг',
    title: 'Сохранить в рейтинг',
    enterName: 'Введите имя для рейтинга.',
    passwordShort: (n) => `Пароль должен содержать не менее ${n} символов.`,
    failed: 'Не удалось сохранить. Попробуйте снова.',
    savedRank: (rank) => `Сохранено! Вы на ${rank}-м месте в рейтинге.`,
    savedKept: (rank) => `Сохранено. Ваш лучший результат по-прежнему на ${rank}-м месте.`,
    bestLine: (songs, points) => `Рекорд: ${songs} ${songWord(songs)} · ${points} ${pointWord(points)}`,
    viewBoard: 'Открыть рейтинг',
    namePlaceholder: 'Выберите имя. Его нельзя изменить.',
    password: 'Пароль',
    passwordPlaceholder: (n) => `Не менее ${n} символов`,
    passwordNote: 'Нужен, чтобы снова сохранить результат под этим именем. Восстановить его нельзя.',
    avatar: 'Аватар (необязательно)',
    noAvatar: 'Без аватара',
    avatarLabel: (a) => `Аватар ${a}`,
    saving: 'Сохраняем…',
    save: 'Сохранить'
  },

  board: {
    you: 'Вы',
    songs: songWord,
    points: pointWord,
    loadError: 'Не удалось загрузить рейтинг. Обновите страницу.',
    loading: 'Загружаем рейтинг…',
    empty: 'Сохранённых результатов пока нет.',
    player: 'Игрок',
    songsHead: 'Песни',
    pointsHead: 'Очки',
    yourBest: 'Ваш лучший результат'
  },

  settings: {
    title: 'Настройки',
    filterTitle: 'Фильтр песен',
    closeLabel: 'Закрыть настройки',
    mode: 'Режим игры',
    daily: 'День',
    unlimited: 'Unlimited',
    party: 'Party',
    sound: 'Звуковые эффекты',
    soundNote: 'Короткий звук при верном, неверном и пропущенном ответе.',
    charts: 'Чарты по странам',
    decades: 'Десятилетия',
    genres: 'Жанры',
    match: (n) => `Подходит песен: ${n}.`
  },

  guess: {
    label: 'Ваш ответ',
    placeholder: 'Название песни или исполнитель',
    button: 'Ответить',
    suggestions: 'Подсказки'
  },

  attempts: {
    label: 'Ваши ответы',
    hint: (i, clip, points) => `Попытка ${i + 1} · ${clip} · ${points} ${pointWord(points)}`,
    skipped: 'Пропущено'
  },

  player: {
    label: 'Плеер фрагмента',
    length: 'Длина фрагмента',
    stop: 'Остановить фрагмент',
    play: 'Воспроизвести фрагмент',
    error: 'Не удалось загрузить фрагмент. Попробуйте снова или пропустите его.'
  },

  reveal: { itWas: 'Это была ' },
  country: { label: 'Страна', current: (name) => `Страна: ${name}` },

  party: {
    defaultName: 'Игрок',
    someone: 'Кто-то',
    you: 'Вы',
    youLower: 'вы',
    me: 'Я',
    nobody: 'никто',
    songsFrom: 'Песни из',
    sizes: {
      '1v1': { label: '1 на 1', note: 'Только вы и ещё один игрок' },
      '3s': { label: '3', note: 'Три игрока' },
      '4-6': { label: '4–6', note: 'От 4 до 6 игроков' },
      '8-10': { label: '8–10', note: 'От 8 до 10 игроков' }
    },
    instruments: { guitar: 'гитара', drums: 'барабаны', keys: 'клавиши', sax: 'саксофон', trumpet: 'труба', violin: 'скрипка', headphones: 'наушники', radio: 'радио' },
    settingSongs: 'Песни',
    settingSongsHelp: 'Количество песен в игре.',
    settingSeats: 'Места',
    settingSeatsHelp: 'Максимум игроков в комнате.',
    less: (label) => `${label}: меньше`,
    more: (label) => `${label}: больше`,
    closedRoom: 'Эта комната закрыта или не существует. Проверьте код или создайте новую комнату.',
    otherTab: 'Вы открыли эту комнату в другой вкладке, поэтому эта вкладка вышла из неё.',
    wrongGuess: 'Не та песня! Попробуйте снова через 2 секунды.',
    openFailed: 'Не удалось открыть комнату. Попробуйте снова.',
    codeFormat: 'Код комнаты состоит из 4 букв, например SONG.',
    noRoom: 'Комнаты с таким кодом нет. Уточните код у создателя комнаты.',
    roomFull: 'Эта комната заполнена.',
    inviteText: (code) => `Заходи в мою комнату Songless Party: ${code}`,
    multiplayer: 'Мультиплеер',
    title: 'Songless Party',
    pickInstrument: 'Выберите инструмент',
    clipScore: (score, solved) => `${score} ${pointWord(score)} · ${solved} ${songWord(solved)}`,
    finalScores: 'Итоговый счёт',
    nobodyScored: 'Никто не набрал очков',
    tie: (names) => `Ничья: ${names}`,
    tieJoin: ' и ',
    youWin: 'Вы победили!',
    wins: (name) => `Победитель: ${name}!`,
    youTag: ' (вы)',
    songsThisGame: 'Песни этой игры',
    share: 'Поделиться',
    intro: 'Все слышат один и тот же фрагмент. Назовите песню первым, чтобы получить очки. После последней песни побеждает тот, у кого больше очков.',
    whoPlaying: 'Кто играет',
    quickPlay: 'Быстрая игра',
    tableSize: 'Размер комнаты',
    quickNote: (note) => `${note}. Подключает к открытой публичной комнате или создаёт новую.`,
    finding: 'Ищем комнату…',
    host: 'Создать комнату',
    privacy: 'Доступ к комнате',
    public: 'Публичная',
    private: 'Закрытая',
    publicNote: 'Видна в списке ниже, войти может любой.',
    privateNote: 'Не видна в списке, друзья входят по коду.',
    joinWithCode: 'Войти по коду',
    roomCode: 'Код комнаты',
    join: 'Войти',
    publicRooms: 'Публичные комнаты',
    openCount: (n) => `открыто: ${n}`,
    looking: 'Ищем комнаты…',
    noRooms: 'Публичных комнат пока нет. Нажмите «Быстрая игра» или создайте свою, и она появится здесь.',
    playing: 'идёт игра',
    inLobby: 'в лобби',
    full: 'Мест нет',
    phaseWaiting: 'Ожидание',
    phaseReady: 'Приготовьтесь',
    phaseOver: 'Игра окончена',
    phaseAnswer: 'Ответ',
    phasePlaying: 'Идёт игра',
    copyLink: 'Скопировать ссылку-приглашение',
    room: 'Комната',
    linkCopied: 'Ссылка скопирована!',
    copyInvite: 'Пригласить',
    players: 'Игроки',
    inRoom: 'в комнате',
    song: 'Песня',
    quit: 'Выйти',
    away: 'не на связи',
    clipLabel: (clip, points, status) => `${clip} с · ${points} ${pointWord(points)} · ${status}`,
    listen: 'слушайте…',
    toAnswer: (n) => `${n} с на ответ`,
    gotIt: (name, points) => `${name}: верно · +${points}`,
    nobodyGot: 'Никто не угадал',
    backLobby: 'Вернуться в лобби',
    joining: 'Входим…',
    connecting: 'Подключаемся к комнате…',
    joinRoom: (code) => `Войти в комнату ${code}`,
    finished: 'Эта игра окончена.',
    isFull: 'Эта комната заполнена.',
    takeSeat: 'Занять место',
    underWay: 'Игра уже идёт. Займите место и подключайтесь со следующего ответа.',
    start: 'Начать игру',
    needPlayer: 'Нужен ещё хотя бы один игрок. Отправьте ему код!',
    ready: (players, songs) => `${players} ${playerWord(players)} готовы · ${songs} ${songWord(songs)}`,
    roomSettings: 'Настройки комнаты',
    waitingFor: (name) => `Ждём, пока ${name} начнёт игру…`,
    theHost: 'создатель комнаты',
    overBack: (n) => `Игра окончена. Возврат в лобби через ${n} с…`,
    backNow: 'Вернуться в лобби сейчас',
    getReady: 'Приготовьтесь отвечать…',
    lastSong: 'Это была последняя песня!',
    nextComing: 'Скоро следующая песня…',
    nameFirst: 'Назовите песню первым и получите очки!',
    wrongGuesses: 'Неверные ответы на эту песню',
    songsFromHelp: 'Чарты какой страны используются для песен.',
    roomPublicHelp: 'Видна в публичных комнатах, войти может любой.',
    done: 'Готово',
    quitTitle: 'Выйти из комнаты?',
    quitGame: 'Вы потеряете место и счёт в этой игре.',
    quitLobby: 'Вы потеряете место и вернётесь в лобби.'
  },

  server: {
    namesFixed: (name) => `Имя нельзя изменить. Вы сохраняли результат как ${name}.`,
    messages: {
      'Enter a name.': 'Введите имя.',
      'Password must be 6 to 72 characters.': 'Пароль должен содержать от 6 до 72 символов.',
      'Saving too fast. Wait a few seconds and try again.': 'Слишком частое сохранение. Подождите несколько секунд и попробуйте снова.',
      'That name is taken. Pick another one.': 'Это имя занято. Выберите другое.',
      'Wrong password for this name.': 'Неверный пароль для этого имени.',
      "Couldn't reach the server. Check your connection and try again.": 'Нет связи с сервером. Проверьте соединение и попробуйте снова.',
      "Couldn't save. Try again.": 'Не удалось сохранить. Попробуйте снова.',
      'Something went wrong. Try again.': 'Что-то пошло не так. Попробуйте снова.',
      'Could not open a room. Try again.': 'Не удалось открыть комнату. Попробуйте снова.',
      'No such room.': 'Такой комнаты нет.',
      'This room has closed or never existed. Check the code.': 'Эта комната закрыта или не существует. Проверьте код.',
      'That seat belongs to another player.': 'Это место принадлежит другому игроку.',
      'Your seat in this room was released.': 'Ваше место в этой комнате освобождено.',
      'This game has finished. Host or join another room.': 'Эта игра окончена. Создайте другую комнату или войдите в неё.',
      'This game has finished.': 'Эта игра окончена.',
      'This room is full.': 'Эта комната заполнена.',
      'Only the host can change the room.': 'Изменять комнату может только её создатель.',
      'Settings can be changed before the game starts.': 'Настройки можно менять только до начала игры.',
      'Only the host can start the game.': 'Начать игру может только создатель комнаты.',
      'A game is already running.': 'Игра уже идёт.',
      'You need at least 2 players.': 'Нужно не менее 2 игроков.'
    }
  }
};

export default ru;
