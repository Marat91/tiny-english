/* Учебные данные. Чтобы добавить тему или слова — правьте только этот файл.
   После изменения английских слов пересоберите озвучку: node tools/build-audio.mjs */

const LETTERS = [
  ['A','эй','apple','🍎','яблоко'],   ['B','би','ball','⚽','мяч'],
  ['C','си','cat','🐱','кот'],         ['D','ди','dog','🐶','собака'],
  ['E','и','egg','🥚','яйцо'],         ['F','эф','fish','🐟','рыба'],
  ['G','джи','goat','🐐','коза'],      ['H','эйч','hat','🎩','шляпа'],
  ['I','ай','ice cream','🍦','мороженое'], ['J','джей','juice','🧃','сок'],
  ['K','кей','key','🔑','ключ'],       ['L','эл','lion','🦁','лев'],
  ['M','эм','moon','🌙','луна'],       ['N','эн','nose','👃','нос'],
  ['O','оу','orange','🍊','апельсин'], ['P','пи','pig','🐷','свинка'],
  ['Q','кью','queen','👑','королева'], ['R','ар','rabbit','🐰','кролик'],
  ['S','эс','sun','☀️','солнце'],      ['T','ти','tree','🌳','дерево'],
  ['U','ю','umbrella','☂️','зонт'],    ['V','ви','violin','🎻','скрипка'],
  ['W','дабл-ю','whale','🐳','кит'],   ['X','экс','fox','🦊','лиса'],
  ['Y','уай','yo-yo','🪀','йо-йо'],    ['Z','зи','zebra','🦓','зебра'],
].map(([u,ru,word,emoji,tr]) => ({k:u, u, l:u.toLowerCase(), ru, word, emoji, tr}));

/* Уроки алфавита: какие буквы (от, до) входят в каждый урок */
const ABC_RANGES = [[0,4],[4,8],[8,12],[12,16],[16,20],[20,26]];
const ABC = ABC_RANGES.map(([a,b]) => LETTERS.slice(a,b));

/* Слово: [английское, перевод, картинка].
   Картинка: эмодзи, либо цвет "#rrggbb", либо цифра "1". */
const w = ([en, ru, pic]) => ({
  k: en, en, ru,
  ...(pic[0] === '#' ? {c: pic} : /^\d+$/.test(pic) ? {n: pic} : {e: pic}),
});

/* Темы. Первые пять открываются по одной после каждого урока алфавита, остальные — после предыдущей темы.
   Уроки внутри темы идут по порядку, в конце темы — испытание на все её слова.
   Одно и то же английское слово не должно встречаться в двух темах. */
const TOPICS = [
  {id:'colors', title:'Цвета', icon:'🎨', lessons:[
    [['red','красный','#ef4444'], ['blue','синий','#3b82f6'], ['green','зелёный','#22c55e'], ['yellow','жёлтый','#facc15']],
    [['orange','оранжевый','#fb923c'], ['purple','фиолетовый','#a855f7'], ['black','чёрный','#1f2937'], ['white','белый','#ffffff']],
  ]},
  {id:'animals', title:'Животные', icon:'🐾', lessons:[
    [['cat','кошка','🐱'], ['dog','собака','🐶'], ['bird','птица','🐦'], ['fish','рыба','🐟']],
    [['cow','корова','🐮'], ['horse','лошадь','🐴'], ['bear','медведь','🐻'], ['frog','лягушка','🐸']],
  ]},
  {id:'numbers', title:'Цифры', icon:'🔢', lessons:[
    [['one','один','1'], ['two','два','2'], ['three','три','3'], ['four','четыре','4'], ['five','пять','5']],
    [['six','шесть','6'], ['seven','семь','7'], ['eight','восемь','8'], ['nine','девять','9'], ['ten','десять','10']],
  ]},
  {id:'family', title:'Семья', icon:'👨‍👩‍👧', lessons:[
    [['mom','мама','👩'], ['dad','папа','👨'], ['sister','сестра','👧'], ['brother','брат','👦']],
    [['grandma','бабушка','👵'], ['grandpa','дедушка','👴'], ['baby','малыш','👶'], ['family','семья','👨‍👩‍👧']],
  ]},
  {id:'hello', title:'Первые фразы', icon:'👋', lessons:[
    [['hello','привет','👋'], ['bye','пока','🚪'], ['thank you','спасибо','🙏'], ['please','пожалуйста','🥺']],
    [['yes','да','✅'], ['no','нет','❌'], ['good morning','доброе утро','🌅'], ['good night','спокойной ночи','🌙']],
  ]},
  {id:'food', title:'Еда', icon:'🍽️', lessons:[
    [['bread','хлеб','🍞'], ['milk','молоко','🥛'], ['cheese','сыр','🧀'], ['apple','яблоко','🍎']],
    [['banana','банан','🍌'], ['water','вода','💧'], ['cake','торт','🍰'], ['soup','суп','🍲']],
  ]},
  {id:'body', title:'Тело', icon:'🖐️', lessons:[
    [['eye','глаз','👁️'], ['ear','ухо','👂'], ['nose','нос','👃'], ['mouth','рот','👄']],
    [['hand','рука','✋'], ['leg','нога','🦵'], ['foot','ступня','🦶'], ['tooth','зуб','🦷']],
  ]},
  {id:'clothes', title:'Одежда', icon:'👕', lessons:[
    [['T-shirt','футболка','👕'], ['dress','платье','👗'], ['cap','кепка','🧢'], ['shoes','обувь','👟']],
    [['jeans','джинсы','👖'], ['socks','носки','🧦'], ['coat','пальто','🧥'], ['scarf','шарф','🧣']],
  ]},
  {id:'home', title:'Дом', icon:'🏠', lessons:[
    [['house','дом','🏠'], ['door','дверь','🚪'], ['bed','кровать','🛏️'], ['chair','стул','🪑']],
    [['sofa','диван','🛋️'], ['lamp','лампа','💡'], ['clock','часы','🕰️'], ['bath','ванна','🛁']],
  ]},
  {id:'school', title:'Школа', icon:'🎒', lessons:[
    [['book','книга','📖'], ['pen','ручка','🖊️'], ['pencil','карандаш','✏️'], ['bag','рюкзак','🎒']],
    [['school','школа','🏫'], ['teacher','учитель','👩‍🏫'], ['ruler','линейка','📏'], ['scissors','ножницы','✂️']],
  ]},
  {id:'toys', title:'Игрушки', icon:'🧸', lessons:[
    [['ball','мяч','⚽'], ['car','машина','🚗'], ['teddy bear','мишка','🧸'], ['robot','робот','🤖']],
    [['kite','воздушный змей','🪁'], ['train','поезд','🚂'], ['balloon','шарик','🎈'], ['drum','барабан','🥁']],
  ]},
  {id:'weather', title:'Погода', icon:'⛅', lessons:[
    [['sun','солнце','☀️'], ['rain','дождь','🌧️'], ['snow','снег','❄️'], ['wind','ветер','💨']],
    [['cloud','облако','☁️'], ['rainbow','радуга','🌈'], ['hot','жарко','🥵'], ['cold','холодно','🥶']],
  ]},
  {id:'verbs', title:'Действия', icon:'🏃', lessons:[
    [['run','бегать','🏃'], ['swim','плавать','🏊'], ['sleep','спать','😴'], ['eat','есть','🍽️']],
    [['read','читать','📚'], ['sing','петь','🎤'], ['dance','танцевать','💃'], ['draw','рисовать','🖍️']],
  ]},
  {id:'numbers2', title:'Цифры 11–20', icon:'🔟', lessons:[
    [['eleven','одиннадцать','11'], ['twelve','двенадцать','12'], ['thirteen','тринадцать','13'], ['fourteen','четырнадцать','14'], ['fifteen','пятнадцать','15']],
    [['sixteen','шестнадцать','16'], ['seventeen','семнадцать','17'], ['eighteen','восемнадцать','18'], ['nineteen','девятнадцать','19'], ['twenty','двадцать','20']],
  ]},
  {id:'fruits', title:'Фрукты и овощи', icon:'🍓', lessons:[
    [['grape','виноград','🍇'], ['pear','груша','🍐'], ['strawberry','клубника','🍓'], ['watermelon','арбуз','🍉']],
    [['carrot','морковка','🥕'], ['potato','картошка','🥔'], ['tomato','помидор','🍅'], ['cucumber','огурец','🥒']],
  ]},
  {id:'feelings', title:'Чувства', icon:'😊', lessons:[
    [['happy','весёлый','😊'], ['sad','грустный','😢'], ['angry','сердитый','😠'], ['tired','уставший','😩']],
    [['scared','испуганный','😱'], ['hungry','голодный','😋'], ['sick','больной','🤒'], ['sleepy','сонный','🥱']],
  ]},
  {id:'transport', title:'Транспорт', icon:'🚌', lessons:[
    [['bus','автобус','🚌'], ['plane','самолёт','✈️'], ['boat','лодка','⛵'], ['bike','велосипед','🚲']],
    [['ship','корабль','🚢'], ['helicopter','вертолёт','🚁'], ['rocket','ракета','🚀'], ['taxi','такси','🚕']],
  ]},
  {id:'zoo', title:'Зоопарк', icon:'🦁', lessons:[
    [['lion','лев','🦁'], ['tiger','тигр','🐯'], ['monkey','обезьяна','🐵'], ['elephant','слон','🐘']],
    [['giraffe','жираф','🦒'], ['zebra','зебра','🦓'], ['snake','змея','🐍'], ['crocodile','крокодил','🐊']],
  ]},
  {id:'nature', title:'Природа', icon:'🌳', lessons:[
    [['flower','цветок','🌸'], ['tree','дерево','🌳'], ['grass','трава','🌱'], ['sea','море','🌊']],
    [['mountain','гора','⛰️'], ['river','река','🏞️'], ['star','звезда','⭐'], ['moon','луна','🌙']],
  ]},
  {id:'jobs', title:'Профессии', icon:'🧑‍🚒', lessons:[
    [['doctor','врач','🧑‍⚕️'], ['cook','повар','🧑‍🍳'], ['farmer','фермер','🧑‍🌾'], ['pilot','лётчик','🧑‍✈️']],
    [['police officer','полицейский','👮'], ['firefighter','пожарный','🧑‍🚒'], ['artist','художник','🧑‍🎨'], ['singer','певец','🧑‍🎤']],
  ]},
].map(t => ({...t, lessons: t.lessons.map(set => set.map(w))}));

/* Фразы: короткие предложения из уже знакомых слов. Урок открывается, когда пройдена его тема.
   Последнее слово фразы должно быть словом из этой темы — от него берётся картинка. */
const WORDS = {};
TOPICS.forEach(t => t.lessons.flat().forEach(x => { WORDS[x.en] = x }));
const PHRASES = [
  {topic:'colors',  pat:'It is …',      set:[['It is red','Это красный'], ['It is blue','Это синий'], ['It is green','Это зелёный'], ['It is yellow','Это жёлтый']]},
  {topic:'animals', pat:'I have a …',   set:[['I have a cat','У меня есть кошка'], ['I have a dog','У меня есть собака'], ['I have a bird','У меня есть птица'], ['I have a fish','У меня есть рыбка']]},
  {topic:'family',  pat:'This is my …', set:[['This is my mom','Это моя мама'], ['This is my dad','Это мой папа'], ['This is my sister','Это моя сестра'], ['This is my brother','Это мой брат']]},
  {topic:'food',    pat:'I like …',     set:[['I like milk','Я люблю молоко'], ['I like bread','Я люблю хлеб'], ['I like cheese','Я люблю сыр'], ['I like cake','Я люблю торт']]},
  {topic:'toys',    pat:'I see a …',    set:[['I see a ball','Я вижу мяч'], ['I see a car','Я вижу машину'], ['I see a robot','Я вижу робота'], ['I see a train','Я вижу поезд']]},
  {topic:'verbs',   pat:'I can …',      set:[['I can run','Я умею бегать'], ['I can swim','Я умею плавать'], ['I can sing','Я умею петь'], ['I can dance','Я умею танцевать']]},
  {topic:'body',    pat:'Touch your …', set:[['Touch your nose','Потрогай нос'], ['Touch your ear','Потрогай ухо'], ['Touch your mouth','Потрогай рот'], ['Touch your eye','Потрогай глаз']]},
  {topic:'clothes', pat:'Put on your …', set:[['Put on your cap','Надень кепку'], ['Put on your coat','Надень пальто'], ['Put on your scarf','Надень шарф'], ['Put on your socks','Надень носки']]},
  {topic:'home',    pat:'Where is the …', set:[['Where is the lamp','Где лампа?'], ['Where is the clock','Где часы?'], ['Where is the sofa','Где диван?'], ['Where is the chair','Где стул?']]},
  {topic:'school',  pat:'Give me a …',  set:[['Give me a book','Дай мне книгу'], ['Give me a pen','Дай мне ручку'], ['Give me a pencil','Дай мне карандаш'], ['Give me a ruler','Дай мне линейку']]},
  {topic:'weather', pat:'I see a …',    set:[['I see a cloud','Я вижу облако'], ['I see a rainbow','Я вижу радугу'], ['I see the sun','Я вижу солнце'], ['I see the snow','Я вижу снег']]},
  {topic:'fruits',  pat:'I want a …',   set:[['I want a pear','Я хочу грушу'], ['I want a carrot','Я хочу морковку'], ['I want a tomato','Я хочу помидор'], ['I want a strawberry','Я хочу клубнику']]},
  {topic:'feelings',pat:'I am …',       set:[['I am happy','Мне весело'], ['I am sad','Мне грустно'], ['I am tired','Я устал'], ['I am hungry','Я голодный']]},
  {topic:'transport',pat:'I go by …',   set:[['I go by bus','Я еду на автобусе'], ['I go by bike','Я еду на велосипеде'], ['I go by boat','Я плыву на лодке'], ['I go by plane','Я лечу на самолёте']]},
  {topic:'zoo',     pat:'Look at the …', set:[['Look at the lion','Посмотри на льва'], ['Look at the monkey','Посмотри на обезьяну'], ['Look at the elephant','Посмотри на слона'], ['Look at the giraffe','Посмотри на жирафа']]},
  {topic:'nature',  pat:'I like the …', set:[['I like the sea','Я люблю море'], ['I like the flower','Мне нравится цветок'], ['I like the moon','Мне нравится луна'], ['I like the river','Мне нравится река']]},
  {topic:'jobs',    pat:'I want to be a …', set:[['I want to be a doctor','Я хочу быть врачом'], ['I want to be a pilot','Я хочу быть лётчиком'], ['I want to be a cook','Я хочу быть поваром'], ['I want to be a singer','Я хочу быть певцом']]},
].map(ph => ({...ph, set: ph.set.map(([en, ru]) => { const wn = en.split(' ').pop(); return {...WORDS[wn], k: en, en, ru, w: wn} })}));

/* Задания, которые произносятся по-русски перед английским словом (один раз за урок на каждый вид задания).
   Ключ — вид задания в игре. После изменения пересоберите озвучку: node tools/build-audio.mjs */
const HINTS = {
  intro:   'Новая буква! Послушай, как она называется, и запомни слово.',
  listen:  'Послушай и найди букву.',
  missing: 'Какой буквы не хватает в слове? Выбери её.',
  pairs:   'Найди пары: большую и маленькую букву.',
  wintro:  'Новое слово! Послушай, как оно звучит по-английски.',
  wlisten: 'Послушай слово и найди картинку.',
  wread:   'Как это будет по-английски? Выбери слово.',
  whear:   'Послушай и выбери слово, которое услышал.',
  wpairs:  'Найди пары: картинку и слово.',
  exam:    'Это испытание! Проверим, что ты запомнил. Ошибаться можно.',
  review:  'Давай повторим слова, которые ты уже знаешь.',
  wbuild:  'Собери слово из букв. Нажимай буквы по порядку.',
  walk:    'Идём гулять! Ответь на вопросы по дороге.',
  pintro:  'Новая фраза! Послушай и повтори вслух.',
  plisten: 'Послушай фразу и найди картинку.',
  pbuild:  'Собери фразу из слов. Нажимай слова по порядку.',
  phear:   'Послушай и выбери фразу, которую услышал.',
  g_b:     'Лопай шарики с тем, что услышишь!',
  g_y:     'Картинка и слово совпадают? Отвечай: да или нет.',
  g_m:     'Найди все пары как можно быстрее!',
  duel:    'Дуэль! Отвечай правильно и быстро.',
};

/* Похвала в конце урока: 3, 2 и 1 звезда */
const PRAISE = [
  {en:'Excellent!', ru:'Отлично!'},
  {en:'Good job!',  ru:'Хорошая работа!'},
  {en:'Nice try!',  ru:'Неплохо! Попробуй ещё раз — получится лучше'},
];

/* Подарки персонажу: сколько звёзд нужно */
const TOYS = [
  {at:3,  name:'красный ошейник', icon:'📿'},
  {at:10, name:'бантик',          icon:'🎀'},
  {at:20, name:'крутые очки',     icon:'🕶️'},
  {at:32, name:'корона',          icon:'👑'},
];

/* Магазин. Вещи покупаются за косточки. type:
     need — нужное: без вещи нельзя ухаживать за питомцем;
     use  — полезное: приносит выгоду со временем;
     fun  — красивое: только для радости.
   pos — место в комнате [слева %, снизу %, размер]; yard — вещь стоит во дворе; rare — продаётся только на ярмарке по выходным.
   Названия — английские слова (озвучка: уроки или EXTRA ниже). */
const SHOP = [
  {id:'bowl',    type:'need', en:'bowl',       ru:'миска',    icon:'🥣', price:0,   pos:[33,1,.8],   why:'чтобы кормить'},
  {id:'leash',   type:'need', en:'leash',      ru:'поводок',  icon:'🦮', price:15,                   why:'чтобы гулять'},
  {id:'bed',     type:'need', en:'bed',        ru:'кроватка', icon:'🛏️', price:40,  pos:[2,22,1.9],  why:'чтобы высыпаться'},
  {id:'pig',     type:'use',  en:'pig',        ru:'копилка',  icon:'🐷', price:25,  pos:[92,27,.9],  why:'копит косточки с прибавкой'},
  {id:'tree',    type:'use',  en:'tree',       ru:'дерево',   icon:'🌳', price:60,  yard:true,       why:'+2 🦴 в день, когда занимаешься', day:2},
  {id:'shelf',   type:'use',  en:'books',      ru:'полка с книгами', icon:'📚', price:80, pos:[86,68,1.1], why:'+1 🦴 за каждый урок', lesson:1},
  {id:'shop',    type:'use',  en:'shop',       ru:'лавка',    icon:'🏪', price:150, yard:true,       why:'+5 🦴 в день, когда занимаешься', day:5},
  {id:'balloon', type:'fun',  en:'balloon',    ru:'шарик',    icon:'🎈', price:10,  pos:[88,48,1.2]},
  {id:'book',    type:'fun',  en:'book',       ru:'книга',    icon:'📖', price:10,  pos:[20,5,.9]},
  {id:'ball',    type:'fun',  en:'ball',       ru:'мяч',      icon:'⚽', price:15,  pos:[76,3,.9]},
  {id:'cake',    type:'fun',  en:'cake',       ru:'торт',     icon:'🍰', price:20,  pos:[50,0,.9]},
  {id:'teddy',   type:'fun',  en:'teddy bear', ru:'мишка',    icon:'🧸', price:20,  pos:[24,22,1.2]},
  {id:'lamp',    type:'fun',  en:'lamp',       ru:'лампа',    icon:'💡', price:25,  pos:[46,80,1]},
  {id:'clock',   type:'fun',  en:'clock',      ru:'часы',     icon:'🕰️', price:25,  pos:[5,66,1.2]},
  {id:'car',     type:'fun',  en:'car',        ru:'машина',   icon:'🚗', price:30,  pos:[4,3,1]},
  {id:'kite',    type:'fun',  en:'kite',       ru:'змей',     icon:'🪁', price:30,  pos:[20,70,1.2]},
  {id:'drum',    type:'fun',  en:'drum',       ru:'барабан',  icon:'🥁', price:35,  pos:[62,2,1]},
  {id:'sofa',    type:'fun',  en:'sofa',       ru:'диван',    icon:'🛋️', price:40,  pos:[64,24,2]},
  {id:'robot',   type:'fun',  en:'robot',      ru:'робот',    icon:'🤖', price:50,  pos:[88,8,1.2]},
  {id:'rainbow', type:'fun',  en:'rainbow',    ru:'радуга',   icon:'🌈', price:60,  pos:[60,66,1.6]},
  {id:'star',    type:'fun',  en:'star',       ru:'звезда',   icon:'⭐', price:50,  pos:[33,84,.8],  rare:true},
  {id:'guitar',  type:'fun',  en:'guitar',     ru:'гитара',   icon:'🎸', price:60,  pos:[14,44,1.2], rare:true},
  {id:'tent',    type:'fun',  en:'tent',       ru:'палатка',  icon:'⛺', price:60,  yard:true,       rare:true},
  {id:'rocket',  type:'fun',  en:'rocket',     ru:'ракета',   icon:'🚀', price:70,  yard:true,       rare:true},
  {id:'boat',    type:'fun',  en:'boat',       ru:'лодка',    icon:'⛵', price:70,  yard:true,       rare:true},
  {id:'bike',    type:'fun',  en:'bike',       ru:'велосипед',icon:'🚲', price:80,  yard:true,       rare:true},
  {id:'fountain',type:'fun',  en:'fountain',   ru:'фонтан',   icon:'⛲', price:100, yard:true,       rare:true},
  {id:'castle',  type:'fun',  en:'castle',     ru:'замок',    icon:'🏰', price:120, yard:true,       rare:true},
];
/* Еда: f — сытость, m — настроение, cap — выше какого уровня сытость не поднимет */
const FOODS = [
  {id:'water',  en:'water',  ru:'вода',   icon:'💧', price:0, f:10, m:0,  cap:50},
  {id:'bread',  en:'bread',  ru:'хлеб',   icon:'🍞', price:2, f:20, m:0},
  {id:'milk',   en:'milk',   ru:'молоко', icon:'🥛', price:3, f:20, m:8},
  {id:'cheese', en:'cheese', ru:'сыр',    icon:'🧀', price:4, f:35, m:0},
  {id:'cake',   en:'cake',   ru:'торт',   icon:'🍰', price:5, f:10, m:25},
  {id:'soup',   en:'soup',   ru:'суп',    icon:'🍲', price:6, f:60, m:0},
];
/* Рост питомца: at — сколько «дней хорошей заботы» нужно; gs — размер картинки */
const STAGES = [
  {at:0,  name:'Малыш',     nameF:'Малышка',   gs:.72},
  {at:3,  name:'Подросток', nameF:'Подросток', gs:.86},
  {at:10, name:'Взрослый',  nameF:'Взрослая',  gs:1},
  {at:25, name:'Чемпион',   nameF:'Чемпионка', gs:1},
];
/* Команды: st — с какой стадии роста питомец их умеет */
const TRICKS = [
  {en:'sit',   ru:'сидеть',  st:1, anim:'sad'},
  {en:'jump',  ru:'прыгай',  st:1, anim:'jump'},
  {en:'run',   ru:'беги',    st:1, anim:'runx'},
  {en:'dance', ru:'танцуй',  st:2, anim:'dance'},
  {en:'sing',  ru:'пой',     st:2, anim:'jump'},
  {en:'sleep', ru:'спи',     st:2, anim:'nap'},
];
/* Открытки к подаркам */
const CARDS = [
  {en:'This is for you!', ru:'Это тебе!'},
  {en:'Thank you!',       ru:'Спасибо!'},
  {en:'Good job!',        ru:'Молодец!'},
  {en:'Happy birthday!',  ru:'С днём рождения!'},
  {en:'I like you!',      ru:'Ты мне нравишься!'},
];
/* Общая цель группы: на что копят все вместе (need — сколько всего косточек нужно к этому шагу) */
const FUND = [
  {name:'Будка',  icon:'🛖', need:150},
  {name:'Сад',    icon:'🌷', need:450},
  {name:'Фонтан', icon:'⛲', need:1000},
  {name:'Замок',  icon:'🏰', need:2000},
];
/* Английские слова и фразы, которых нет в уроках, но они звучат в игре (записываются tools/build-audio.mjs) */
const EXTRA = ['bowl', 'leash', 'books', 'shop', 'star', 'guitar', 'tent', 'rocket', 'boat', 'bike', 'fountain', 'castle',
  'sit', 'jump', 'good dog', 'yummy', "let's go for a walk", 'good night', ...CARDS.map(c => c.en)];
const WALLS = [
  {id:'',       ru:'обычные',                   price:0,  css:'linear-gradient(#fdf1dc,#f8e3c0)', dot:'#f8e3c0'},
  {id:'blue',   en:'blue',   ru:'синие',        price:30, css:'linear-gradient(#cfe6ff,#a9d0ff)', dot:'#3b82f6'},
  {id:'green',  en:'green',  ru:'зелёные',      price:30, css:'linear-gradient(#d9f7e0,#b4ecc3)', dot:'#22c55e'},
  {id:'yellow', en:'yellow', ru:'жёлтые',       price:30, css:'linear-gradient(#fff6c2,#ffe98a)', dot:'#facc15'},
  {id:'purple', en:'purple', ru:'фиолетовые',   price:30, css:'linear-gradient(#ead9ff,#d3b6ff)', dot:'#a855f7'},
];
const FREEZE_PRICE = 30, FREEZE_MAX = 2;

const AVATARS =['👧','👦','🧒','👩','👨','👵','👴','🦸'];
