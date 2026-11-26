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
  {id:'days', title:'Дни недели', icon:'📅', lessons:[
    [['Monday','понедельник','1'], ['Tuesday','вторник','2'], ['Wednesday','среда','3'], ['Thursday','четверг','4']],
    [['Friday','пятница','5'], ['Saturday','суббота','6'], ['Sunday','воскресенье','7'], ['week','неделя','📅']],
  ]},
  {id:'months', title:'Месяцы', icon:'🗓️', lessons:[
    [['January','январь','1'], ['February','февраль','2'], ['March','март','3'], ['April','апрель','4']],
    [['May','май','5'], ['June','июнь','6'], ['July','июль','7'], ['August','август','8']],
    [['September','сентябрь','9'], ['October','октябрь','10'], ['November','ноябрь','11'], ['December','декабрь','12']],
  ]},
  {id:'time', title:'Время года и суток', icon:'🍂', lessons:[
    [['winter','зима','☃️'], ['spring','весна','🌷'], ['summer','лето','🏖️'], ['autumn','осень','🍂']],
    [['morning','утро','🌄'], ['day','день','🏙️'], ['evening','вечер','🌆'], ['night','ночь','🌃']],
  ]},
  {id:'adjectives', title:'Какой?', icon:'🐘', lessons:[
    [['big','большой','🐘'], ['small','маленький','🐭'], ['fast','быстрый','🐆'], ['slow','медленный','🐢']],
    [['tall','высокий','🦒'], ['long','длинный','🐍'], ['new','новый','🎁'], ['old','старый','🏚️']],
  ]},
  {id:'directions', title:'Куда?', icon:'⬆️', lessons:[
    [['up','вверх','⬆️'], ['down','вниз','⬇️'], ['left','налево','⬅️'], ['right','направо','➡️']],
    [['stop','стоп','🛑'], ['go','иди','🟢'], ['here','здесь','📍'], ['there','там','👉']],
  ]},
  /* Праздничная тема: открыта во время новогоднего события (и потом — если её начали). См. NY ниже */
  {id:'newyear', title:'Новый год', icon:'🎄', holiday:true, lessons:[
    [['Christmas tree','ёлка','🎄'], ['gift','подарок','🎁'], ['Santa','Дед Мороз','🎅'], ['snowman','снеговик','⛄']],
    [['snowflake','снежинка','❄️'], ['candle','свеча','🕯️'], ['bell','колокольчик','🔔'], ['reindeer','олень','🦌']],
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
  {topic:'days',    pat:'Today is …',   set:[['Today is Monday','Сегодня понедельник'], ['Today is Friday','Сегодня пятница'], ['Today is Saturday','Сегодня суббота'], ['Today is Sunday','Сегодня воскресенье']]},
  {topic:'time',    pat:'I like …',     set:[['I like winter','Я люблю зиму'], ['I like spring','Я люблю весну'], ['I like summer','Я люблю лето'], ['I like autumn','Я люблю осень']]},
  {topic:'adjectives', pat:'It is …',   set:[['It is big','Он большой'], ['It is small','Он маленький'], ['It is fast','Он быстрый'], ['It is slow','Он медленный']]},
  {topic:'newyear', pat:'I see a …',  set:[['I see a snowman','Я вижу снеговика'], ['I see a reindeer','Я вижу оленя'], ['I see a snowflake','Я вижу снежинку'], ['I have a gift','У меня есть подарок']]},
  {topic:'directions', pat:'Look …',    set:[['Look up','Посмотри вверх'], ['Look down','Посмотри вниз'], ['Look left','Посмотри налево'], ['Look right','Посмотри направо']]},
].map(ph => ({...ph, set: ph.set.map(([en, ru]) => { const wn = en.split(' ').pop(); return {...WORDS[wn], k: en, en, ru, w: wn} })}));

/* Учимся читать: слова-«семейки» с одинаковым окончанием. Открывается после всего алфавита.
   Ребёнок читает слово сам (без звука) и подставляет первую букву. fam — общее окончание. */
const READ = [
  [{fam:'at', words:[['cat','кот','🐱'], ['hat','шляпа','🎩'], ['bat','летучая мышь','🦇'], ['rat','крыса','🐀']]},
   {fam:'an', words:[['man','мужчина','🧔'], ['pan','сковорода','🍳'], ['van','фургон','🚐'], ['can','банка','🥫']]}],
  [{fam:'og', words:[['dog','собака','🐶'], ['frog','лягушка','🐸'], ['log','бревно','🪵'], ['fog','туман','🌫️']]},
   {fam:'ox', words:[['box','коробка','📦'], ['fox','лиса','🦊']]}],
  [{fam:'en', words:[['hen','курица','🐔'], ['pen','ручка','🖊️'], ['ten','десять','10']]},
   {fam:'ed', words:[['bed','кровать','🛏️'], ['red','красный','#ef4444'], ['sled','санки','🛷']]}],
  [{fam:'ug', words:[['bug','жук','🐛'], ['hug','обнимашки','🤗'], ['mug','кружка','☕']]},
   {fam:'un', words:[['sun','солнце','☀️'], ['run','бегать','🏃'], ['bun','булочка','🥯']]}],
  /* часть 2: две буквы — один звук. head:'sh' — общее начало, fam — остаток слова */
  [{head:'sh', words:[['ship','корабль','🚢'], ['shoe','туфля','👞'], ['sheep','овца','🐑'], ['shell','ракушка','🐚']]},
   {head:'ch', words:[['chick','цыплёнок','🐥'], ['chair','стул','🪑'], ['cheese','сыр','🧀'], ['cherry','вишня','🍒']]}],
  [{head:'th', words:[['three','три','3'], ['thumb','большой палец','👍'], ['thirteen','тринадцать','13']]},
   {head:'wh', words:[['whale','кит','🐳'], ['wheel','колесо','🛞'], ['white','белый','#ffffff']]}],
  /* «волшебная e» в конце: буква читается как в алфавите */
  [{fam:'ake', words:[['cake','торт','🎂'], ['lake','озеро','🏞️'], ['snake','змея','🐍']]},
   {fam:'ike', words:[['bike','велосипед','🚲'], ['like','нравится','👍']]},
   {fam:'one', words:[['bone','косточка','🦴'], ['cone','рожок','🍦'], ['phone','телефон','📱']]}],
].map((fams, i) => fams.flatMap(f => f.words.map(x => ({...w(x), k: 'r:' + x[0],
  ...(f.head ? {fam: x[0].slice(f.head.length), head: f.head} : {fam: f.fam}), lesson: i}))));
/* Слова, которые читают целиком: без картинок, учим по примерам. Открывается после 4-го урока чтения. */
const SIGHT = [
  [['the','—','I see the cat'], ['is','есть, является','The sun is hot'], ['and','и','Mom and dad'], ['I','я','I can run'], ['you','ты','I like you']],
  [['a','—','I have a dog'], ['it','это, оно','It is red'], ['my','мой','This is my bed'], ['can','умею, могу','I can swim'], ['see','вижу','I see a bird']],
].map(set => set.map(([en, ru, ex]) => ({k: 's:' + en, en, ru, ex, e: '📖'})));
/* Мини-книжки: каждое слово можно нажать и услышать. after — какой урок чтения нужен */
const BOOKS = [
  {after:'rd:0', title:'The cat', icon:'🐱', pages:[['I see a cat.','🐱'], ['The cat has a hat.','🐱🎩'], ['The cat is fat.','😺'], ['The cat sat on a mat.','🐱🟫']]},
  {after:'rd:1', title:'Dog and frog', icon:'🐸', pages:[['A dog sat on a log.','🐶🪵'], ['A frog sat on the log.','🐸🪵'], ['The dog and the frog see a fox.','🐶🐸🦊'], ['Run, frog, run!','🐸💨']]},
  {after:'rd:2', title:'My red bed', icon:'🛏️', pages:[['I have a red bed.','🛏️'], ['Ten hens sat on my bed!','🐔🐔🐔'], ['Get off my bed, hens!','😠'], ['Now I can sleep.','😴']]},
  {after:'rd:3', title:'Fun in the sun', icon:'☀️', pages:[['The sun is up.','☀️'], ['A bug can run.','🐛💨'], ['A bug can hug.','🐛🤗'], ['We have fun in the sun!','😎']]},
  {after:'rd:4', title:'The big ship', icon:'🚢', pages:[['I see a big ship.','🚢'], ['A sheep is on the ship.','🐑🚢'], ['A chick is on the ship.','🐥🚢'], ['The ship goes to the sea.','🌊']]},
  {after:'rd:6', title:'The cake', icon:'🎂', pages:[['I like cake.','🎂'], ['I ride my bike to the lake.','🚲🏞️'], ['A snake is at the lake!','🐍'], ['The snake likes cake too.','🐍🎂']]},
].map((b, i) => ({...b, i, pages: b.pages.map(([en, e]) => ({en, e}))}));

/* Разговор: вопрос и ответ. Открывается после темы after. Картинка подсказывает, какой ответ верный. */
const DIALOGS = [
  {after:'hello', title:'Знакомство', icon:'👋', set:[
    ['What is your name?', 'Как тебя зовут?', 'My name is Ann', 'Меня зовут Аня', '👧'],
    ['How old are you?', 'Сколько тебе лет?', 'I am six', 'Мне шесть', '6'],
    ['How are you?', 'Как дела?', 'I am fine', 'Хорошо', '🙂'],
    ['Good morning!', 'Доброе утро!', 'Good morning, mom!', 'Доброе утро, мама!', '🌅'],
  ]},
  {after:'colors', title:'Какого цвета?', icon:'🎨', set:[
    ['What color is the sun?', 'Какого цвета солнце?', 'It is yellow', 'Жёлтое', '☀️'],
    ['What color is the grass?', 'Какого цвета трава?', 'It is green', 'Зелёная', '🌿'],
    ['What color is the sky?', 'Какого цвета небо?', 'It is blue', 'Синее', '🌌'],
    ['What color is the apple?', 'Какого цвета яблоко?', 'It is red', 'Красное', '🍎'],
  ]},
  {after:'animals', title:'Кто это?', icon:'🐾', set:[
    ['Is it a cat?', 'Это кошка?', 'Yes, it is', 'Да', '🐱'],
    ['Is it a dog?', 'Это собака?', 'No, it is a cow', 'Нет, это корова', '🐮'],
    ['What is it?', 'Что это?', 'It is a frog', 'Это лягушка', '🐸'],
    ['Is it a bird?', 'Это птица?', 'No, it is a fish', 'Нет, это рыба', '🐟'],
  ]},
  {after:'numbers', title:'Сколько?', icon:'🔢', set:[
    ['How many apples?', 'Сколько яблок?', 'Three apples', 'Три яблока', '🍎🍎🍎'],
    ['How many cats?', 'Сколько кошек?', 'Two cats', 'Две кошки', '🐱🐱'],
    ['How many balls?', 'Сколько мячей?', 'Four balls', 'Четыре мяча', '⚽⚽⚽⚽'],
    ['How many stars?', 'Сколько звёзд?', 'One star', 'Одна звезда', '⭐'],
  ]},
  {after:'family', title:'Кто это?', icon:'👨‍👩‍👧', set:[
    ['Who is this?', 'Кто это?', 'This is my mom', 'Это моя мама', '👩'],
    ['Who is she?', 'Кто она?', 'She is my sister', 'Это моя сестра', '👧'],
    ['Who is he?', 'Кто он?', 'He is my grandpa', 'Это мой дедушка', '👴'],
    ['Do you have a brother?', 'У тебя есть брат?', 'Yes, I do', 'Да, есть', '👦'],
  ]},
  {after:'food', title:'Что ты любишь?', icon:'🍰', set:[
    ['Do you like cake?', 'Ты любишь торт?', 'Yes, I like cake', 'Да, я люблю торт', '🍰'],
    ['What do you want?', 'Что ты хочешь?', 'I want milk, please', 'Я хочу молока, пожалуйста', '🥛'],
    ['Are you hungry?', 'Ты голодный?', 'Yes, I want soup', 'Да, я хочу суп', '🍲'],
    ['Here is your bread', 'Вот твой хлеб', 'Thank you!', 'Спасибо!', '🍞'],
  ]},
  {after:'feelings', title:'Как дела?', icon:'😊', set:[
    ['How are you today?', 'Как ты сегодня?', 'I am happy', 'Мне весело', '😊'],
    ['Why are you sad?', 'Почему ты грустишь?', 'My dog is sick', 'Моя собака заболела', '🐶🤒'],
    ['Are you tired?', 'Ты устал?', 'Yes, I want to sleep', 'Да, я хочу спать', '😴'],
    ['Are you scared?', 'Тебе страшно?', 'No, I am fine', 'Нет, всё хорошо', '🙂'],
  ]},
].map((d, i) => ({...d, set: d.set.map(([q, qru, en, ru, pic]) => ({...w([en, ru, pic]), k: 'd:' + i + ':' + en, q, qru}))}));

/* Истории: несколько картинок с подписями и вопросы по ним. Открывается после темы after.
   В вопросе варианты — слова из уроков, первый вариант — верный. */
const STORIES = [
  {after:'food', title:'My dog', ru:'Моя собака', icon:'🐶', pages:[
    ['This is my dog', 'Это моя собака', '🐶'],
    ['My dog is black', 'Моя собака чёрная', '🐕‍🦺'],
    ['My dog can run', 'Моя собака умеет бегать', '🐕💨'],
    ['My dog likes milk', 'Моя собака любит молоко', '🐶🥛'],
  ], quiz:[
    ['What color is the dog?', 'Какого цвета собака?', ['black', 'white', 'red']],
    ['What can the dog do?', 'Что умеет собака?', ['run', 'swim', 'sing']],
    ['What does the dog like?', 'Что любит собака?', ['milk', 'cake', 'cheese']],
  ]},
  {after:'weather', title:'A cold day', ru:'Холодный день', icon:'🌧️', pages:[
    ['It is cold', 'Холодно', '🥶'],
    ['I see the rain', 'Я вижу дождь', '🌧️'],
    ['I put on my coat', 'Я надеваю пальто', '🧥'],
    ['I put on my scarf', 'Я надеваю шарф', '🧣'],
  ], quiz:[
    ['What do I see?', 'Что я вижу?', ['rain', 'snow', 'sun']],
    ['What do I put on first?', 'Что я надеваю сначала?', ['coat', 'dress', 'T-shirt']],
    ['Is it hot or cold?', 'Жарко или холодно?', ['cold', 'hot']],
  ]},
  {after:'zoo', title:'At the zoo', ru:'В зоопарке', icon:'🦁', pages:[
    ['I go to the zoo by bus', 'Я еду в зоопарк на автобусе', '🚌'],
    ['I see a monkey', 'Я вижу обезьяну', '🐵'],
    ['The monkey can dance', 'Обезьяна умеет танцевать', '🐵💃'],
    ['I am happy', 'Мне весело', '😊'],
  ], quiz:[
    ['How do I go to the zoo?', 'На чём я еду в зоопарк?', ['bus', 'plane', 'boat']],
    ['What animal do I see?', 'Какое животное я вижу?', ['monkey', 'lion', 'snake']],
    ['What can the monkey do?', 'Что умеет обезьяна?', ['dance', 'swim', 'read']],
    ['How do I feel?', 'Как я себя чувствую?', ['happy', 'sad', 'angry']],
  ]},
  {after:'time', title:'My morning', ru:'Моё утро', icon:'🌄', pages:[
    ['Good morning, mom!', 'Доброе утро, мама!', '👩🌄'],
    ['I eat bread and cheese', 'Я ем хлеб и сыр', '🍞🧀'],
    ['I go to school', 'Я иду в школу', '🏫'],
    ['I read a book', 'Я читаю книгу', '📖'],
  ], quiz:[
    ['What do I eat?', 'Что я ем?', ['bread', 'cake', 'soup']],
    ['Where do I go?', 'Куда я иду?', ['school', 'house', 'sea']],
    ['What do I read?', 'Что я читаю?', ['book', 'pen', 'bag']],
  ]},
  {after:'newyear', title:'New Year', ru:'Новый год', icon:'🎄', pages:[
    ['It is winter', 'Сейчас зима', '☃️'],
    ['I see a big Christmas tree', 'Я вижу большую ёлку', '🎄'],
    ['Santa has a gift for me', 'У Деда Мороза есть подарок для меня', '🎅🎁'],
    ['It is a teddy bear!', 'Это мишка!', '🧸'],
    ['Happy New Year!', 'С Новым годом!', '🎉'],
  ], quiz:[
    ['What is big?', 'Что большое?', ['Christmas tree', 'snowman', 'bell']],
    ['Who has a gift?', 'У кого подарок?', ['Santa', 'teacher', 'baby']],
    ['What is the gift?', 'Какой подарок?', ['teddy bear', 'robot', 'kite']],
  ]},
  {after:'adjectives', title:'My birthday', ru:'Мой день рождения', icon:'🎂', pages:[
    ['Today is Sunday', 'Сегодня воскресенье', '🎉'],
    ['I am seven!', 'Мне семь!', '🎂'],
    ['I see a big cake', 'Я вижу большой торт', '🍰'],
    ['Mom and dad sing', 'Мама и папа поют', '👩👨🎤'],
  ], quiz:[
    ['What day is it?', 'Какой сегодня день?', ['Sunday', 'Monday', 'Friday']],
    ['How old am I?', 'Сколько мне лет?', ['seven', 'five', 'ten']],
    ['What is big?', 'Что большое?', ['cake', 'car', 'ball']],
    ['Who sings?', 'Кто поёт?', ['mom', 'baby', 'teacher']],
  ]},
].map((st, i) => ({...st,
  pages: st.pages.map(([en, ru, e]) => ({en, ru, e})),
  quiz: st.quiz.map(([q, qru, opts]) => ({q, qru, opts: opts.map(o => WORDS[o]), x: WORDS[opts[0]]})),
}));

/* Новогоднее событие: с 1 декабря по 10 января. Адвент-календарь — окошко на каждый день декабря,
   открывается, если в этот день пройден урок. В магазине появляются праздничные вещи (ny:true в SHOP). */
const NY = {from: [11, 1], to: [0, 10], bones: 5, big: {10: 'snowman', 20: 'xbell', 31: 'xtree'}};

/* «Питомец, сделай!»: команды на слух. Если перед командой не сказали please — делать не надо. */
const COMMANDS = [
  {en:'jump', ru:'прыгай', e:'🦘', anim:'jump'}, {en:'sit', ru:'сидеть', e:'🪑', anim:'sad'},
  {en:'run', ru:'беги', e:'🏃', anim:'runx'},     {en:'sleep', ru:'спи', e:'😴', anim:'nap'},
  {en:'dance', ru:'танцуй', e:'💃', anim:'dance'}, {en:'sing', ru:'пой', e:'🎤', anim:'jump'},
  {en:'swim', ru:'плыви', e:'🏊', anim:'jump'},    {en:'eat', ru:'ешь', e:'🍽️', anim:'jump'},
  {en:'touch your nose', ru:'потрогай нос', e:'👃', anim:'jump'}, {en:'touch your ear', ru:'потрогай ухо', e:'👂', anim:'jump'},
  {en:'look up', ru:'посмотри вверх', e:'⬆️', anim:'jump'},       {en:'look down', ru:'посмотри вниз', e:'⬇️', anim:'sad'},
];

/* Грамматика на картинках. Открывается после темы after. gap — слово, которое ребёнок вставляет, opts — варианты. */
const GRAMMAR = [
  {after:'numbers', title:'Один и много', icon:'🐱🐱', set:[
    ['one cat', 'одна кошка', '🐱', 'cat', ['cat', 'cats']],
    ['three cats', 'три кошки', '🐱🐱🐱', 'cats', ['cat', 'cats']],
    ['one dog', 'одна собака', '🐶', 'dog', ['dog', 'dogs']],
    ['two dogs', 'две собаки', '🐶🐶', 'dogs', ['dog', 'dogs']],
    ['one apple', 'одно яблоко', '🍎', 'apple', ['apple', 'apples']],
    ['four apples', 'четыре яблока', '🍎🍎🍎🍎', 'apples', ['apple', 'apples']],
  ]},
  {after:'food', title:'a или an', icon:'🍎', set:[
    ['a cat', 'кошка', '🐱', 'a', ['a', 'an']],
    ['an apple', 'яблоко', '🍎', 'an', ['a', 'an']],
    ['a ball', 'мяч', '⚽', 'a', ['a', 'an']],
    ['an egg', 'яйцо', '🥚', 'an', ['a', 'an']],
    ['a banana', 'банан', '🍌', 'a', ['a', 'an']],
    ['an orange', 'апельсин', '🍊', 'an', ['a', 'an']],
  ]},
  {after:'family', title:'he или she', icon:'👦👧', set:[
    ['He is my dad', 'Он мой папа', '👨', 'He', ['He', 'She']],
    ['She is my mom', 'Она моя мама', '👩', 'She', ['He', 'She']],
    ['He is my brother', 'Он мой брат', '👦', 'He', ['He', 'She']],
    ['She is my sister', 'Она моя сестра', '👧', 'She', ['He', 'She']],
    ['She is my grandma', 'Она моя бабушка', '👵', 'She', ['He', 'She']],
    ['He is my grandpa', 'Он мой дедушка', '👴', 'He', ['He', 'She']],
  ]},
  {after:'animals', title:'This или these', icon:'👉', set:[
    ['This is a cat', 'Это кошка', '🐱', 'This is', ['This is', 'These are']],
    ['These are cats', 'Это кошки', '🐱🐱🐱', 'These are', ['This is', 'These are']],
    ['This is a bird', 'Это птица', '🐦', 'This is', ['This is', 'These are']],
    ['These are birds', 'Это птицы', '🐦🐦', 'These are', ['This is', 'These are']],
  ]},
].map((g, i) => ({...g, set: g.set.map(([en, ru, pic, gap, opts]) => ({...w([en, ru, pic]), k: 'g:' + i + ':' + en, gap, opts}))}));

/* Стишки: простые рифмовки из знакомых слов. Строки подсвечиваются, пока звучат. Открывается после темы after. */
const RHYMES = [
  {after:'hello', title:'Hello!', icon:'👋', lines:[
    ['Hello, hello, how are you?', 'Привет, привет, как дела?'],
    ['I am happy, how are you?', 'Мне весело, а тебе?'],
    ['Hello, hello, one, two, three', 'Привет, привет, раз, два, три'],
    ['Come and play a game with me!', 'Приходи поиграть со мной!'],
  ]},
  {after:'colors', title:'Colors', icon:'🌈', lines:[
    ['Red and yellow, green and blue', 'Красный, жёлтый, зелёный, синий'],
    ['I like colors, so do you!', 'Я люблю цвета, и ты тоже!'],
    ['Purple, orange, black and white', 'Фиолетовый, оранжевый, чёрный, белый'],
    ['Colors, colors, day and night!', 'Цвета, цвета днём и ночью!'],
  ]},
  {after:'animals', title:'Animals', icon:'🐾', lines:[
    ['A cat, a dog, a bird, a frog', 'Кошка, собака, птица, лягушка'],
    ['A little fish, a big brown dog', 'Маленькая рыбка, большая коричневая собака'],
    ['A cow, a horse, a happy bear', 'Корова, лошадь, весёлый медведь'],
    ['Animals, animals everywhere!', 'Животные, животные повсюду!'],
  ]},
  {after:'numbers', title:'Numbers', icon:'🔢', lines:[
    ['One, two, three, four, five', 'Один, два, три, четыре, пять'],
    ['I can swim and I can dive', 'Я умею плавать и нырять'],
    ['Six, seven, eight, nine, ten', 'Шесть, семь, восемь, девять, десять'],
    ['Let us count it all again!', 'Давай посчитаем ещё раз!'],
  ]},
  {after:'body', title:'Touch your nose', icon:'👃', lines:[
    ['Touch your nose and touch your ear', 'Потрогай нос и потрогай ухо'],
    ['Touch your mouth, now I am here', 'Потрогай рот — а вот и я'],
    ['Hands up high and hands down low', 'Руки вверх и руки вниз'],
    ['Jump, jump, jump, and here we go!', 'Прыг, прыг, прыг — поехали!'],
  ]},
  {after:'time', title:'Good night', icon:'🌙', lines:[
    ['The sun goes down, the moon is bright', 'Солнце садится, луна светит'],
    ['I see a star, it is the night', 'Я вижу звезду, наступила ночь'],
    ['Good night, mom, and good night, dad', 'Спокойной ночи, мама, спокойной ночи, папа'],
    ['Now I sleep in my warm bed', 'Теперь я сплю в тёплой кроватке'],
  ]},
].map(r => ({...r, lines: r.lines.map(([en, ru]) => ({en, ru}))}));

/* «Я вижу…»: картинка-сцена и предлоги. Мебель стоит в точке x,y (проценты), s — размер.
   rel: on — на, under — под, in — в, next to — рядом. pl — во множественном числе (are). */
const SCENES = [
  {after:'home', title:'My room', icon:'🛏️', bg:'#fdf1dc', things:{bed:['🛏️',24,58,3.4], chair:['🪑',74,60,2.8], box:['📦',50,74,2.2]}, items:[
    ['cat','кошка','🐱','on','bed'], ['ball','мяч','⚽','under','chair'], ['teddy bear','мишка','🧸','in','box'],
    ['dog','собака','🐶','next to','box'], ['book','книга','📖','on','chair'], ['socks','носки','🧦','under','bed', 1]]},
  {after:'nature', title:'In the park', icon:'🌳', bg:'#e3f7e3', things:{tree:['🌳',22,52,4], car:['🚗',72,72,2.6], basket:['🧺',48,76,2]}, items:[
    ['bird','птица','🐦','on','tree'], ['dog','собака','🐶','under','tree'], ['ball','мяч','⚽','in','basket'],
    ['cat','кошка','🐱','on','car'], ['frog','лягушка','🐸','next to','basket'], ['bike','велосипед','🚲','next to','car']]},
].map((sc, i) => ({...sc, i, items: sc.items.map(([en, ru, e, rel, of, pl]) => ({k: 'sp:' + i + ':' + en, en, ru, e, rel, of, pl: !!pl,
  say: `The ${en} ${pl ? 'are' : 'is'} ${rel} the ${of}`, ask: `Where ${pl ? 'are' : 'is'} the ${en}?`, ans: `${rel} the ${of}`}))}));
const PREP_RU = {on: 'на', under: 'под', in: 'в', 'next to': 'рядом с'};

/* Магазин понарошку: продавец говорит, ребёнок выбирает ответ (первый вариант — верный); pay — заплатить монетками */
const ROLEPLAYS = [
  {after:'food', title:'At the shop', icon:'🏪', who:'👩‍💼', lines:[
    ['Hello! Can I help you?', 'Здравствуйте! Чем помочь?', [['Hello! Can I have a banana, please?', 'Здравствуйте! Можно банан, пожалуйста?'], ['Good night!', 'Спокойной ночи!'], ['I am a banana', 'Я банан']]],
    ['Here you are. That is two coins.', 'Вот, пожалуйста. С тебя две монетки.', 2],
    ['Thank you!', 'Спасибо!', [['Thank you! Bye!', 'Спасибо! До свидания!'], ['Hello!', 'Привет!'], ['I am sad', 'Мне грустно']]],
  ]},
  {after:'fruits', title:'Fruit shop', icon:'🍎', who:'🧑‍🌾', lines:[
    ['Hello! What do you want?', 'Привет! Что ты хочешь?', [['I want apples, please', 'Я хочу яблок, пожалуйста'], ['I am fine', 'Хорошо'], ['It is blue', 'Это синий']]],
    ['How many apples?', 'Сколько яблок?', [['Three apples, please', 'Три яблока, пожалуйста'], ['Yes, I do', 'Да'], ['Good morning', 'Доброе утро']]],
    ['That is five coins.', 'С тебя пять монеток.', 5],
    ['Here you are!', 'Держи!', [['Thank you! Bye!', 'Спасибо! До свидания!'], ['No, thank you', 'Нет, спасибо'], ['Look up', 'Посмотри вверх']]],
  ]},
  {after:'toys', title:'Toy shop', icon:'🧸', who:'🧑', lines:[
    ['Hello! Do you like this robot?', 'Привет! Тебе нравится этот робот?', [['Yes, I do. How much is it?', 'Да. Сколько он стоит?'], ['No, I am a robot', 'Нет, я робот'], ['It is cold', 'Холодно']]],
    ['It is four coins.', 'Четыре монетки.', 4],
    ['Here is your robot!', 'Вот твой робот!', [['Thank you! I am happy!', 'Спасибо! Я рад!'], ['Good night', 'Спокойной ночи'], ['Where is the robot?', 'Где робот?']]],
  ]},
].map((r, i) => ({...r, i, lines: r.lines.map(([en, ru, x]) => typeof x === 'number' ? {en, ru, pay: x} : {en, ru, opts: x.map(([a, b]) => ({en: a, ru: b}))})}));

/* Часы и монетки */
const CLOCK_HOURS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const TIME_SAY = h => `It is ${CLOCK_HOURS[h - 1]} o'clock`;

/* Противоположности и сравнение */
const OPPOSITES = [
  [['hot','горячий','🔥'], ['cold','холодный','🧊']], [['big','большой','🐘'], ['small','маленький','🐭']],
  [['happy','весёлый','😊'], ['sad','грустный','😢']], [['up','вверх','⬆️'], ['down','вниз','⬇️']],
  [['fast','быстрый','🐆'], ['slow','медленный','🐢']], [['open','открытый','📖'], ['closed','закрытый','📕']],
  [['day','день','☀️'], ['night','ночь','🌙']], [['long','длинный','🐍'], ['short','короткий','🐛']],
].map(([a, b], i) => ({i, a: {k: 'o:' + a[0], en: a[0], ru: a[1], e: a[2]}, b: {k: 'o:' + b[0], en: b[0], ru: b[1], e: b[2]}}));
/* Сравнение: q — вопрос, how — как нарисовать разницу (размер, высота, длина) */
const COMPARE = [
  {q:'Which is bigger?', ru:'Что больше?', how:'big'}, {q:'Which is smaller?', ru:'Что меньше?', how:'small'},
  {q:'Which is taller?', ru:'Что выше?', how:'tall'}, {q:'Which is longer?', ru:'Что длиннее?', how:'long'},
];

/* Моя история: ребёнок выбирает героя, цвет, место, умение и настроение */
const STORY_PARTS = {
  hero:  ['cat', 'dog', 'bear', 'frog', 'horse', 'bird', 'monkey', 'robot'],
  color: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'black', 'white'],
  place: ['house', 'school', 'sea', 'river', 'mountain', 'tree'],
  can:   ['run', 'swim', 'sing', 'dance', 'read', 'draw', 'jump', 'sleep'],
  feel:  ['happy', 'sad', 'tired', 'hungry', 'scared', 'angry'],
};
const STORY_BITS = ['This is my', 'My', 'is', 'It is in the', 'It can', 'It is', 'The end!'];

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
  rintro:  'Учимся читать! Посмотри, как пишется слово, и послушай.',
  rread:   'Прочитай слово сам и найди картинку.',
  rfirst:  'Какая буква стоит в начале? Выбери её.',
  rhear:   'Послушай и найди слово, которое услышал.',
  dintro:  'Послушай вопрос и ответ.',
  dpick:   'Послушай вопрос и выбери правильный ответ.',
  dbuild:  'Собери ответ из слов.',
  spage:   'Послушай историю. Нажимай «Дальше», чтобы листать.',
  squiz:   'А теперь вопросы по истории!',
  speak:   'Нажми на микрофон и скажи сам. Потом послушай себя.',
  trace:   'Обведи букву пальцем. Веди по серой линии.',
  gintro:  'Посмотри и послушай, как меняется слово.',
  gfill:   'Какое слово пропущено? Выбери его.',
  rhyme:   'Послушай стишок и повторяй за мной.',
  rgap:    'Какое слово потерялось в стишке?',
  g_c:     'Слушай команды! Если сказали please, нажми, что сделать. Если нет — нажми «Не делать».',
  advent:  'Новогодний календарь! Пройди урок, чтобы открыть окошко.',
  sintro:  'Это слово читают целиком. Запомни, как оно выглядит.',
  sfind:   'Найди это слово в предложении и нажми на него.',
  bpage:   'Послушай страницу. Нажми на любое слово, чтобы услышать его.',
  bself:   'А теперь прочитай сам! Если трудно — нажми на слово.',
  spyintro:'Посмотри на картинку и послушай, где что лежит.',
  spyfind: 'Послушай и нажми на картинке, что услышал.',
  spypick: 'Где это? Выбери правильный ответ.',
  role:    'Ты в магазине! Слушай продавца и выбирай ответ.',
  pay:     'Заплати монетками. Нажимай монетки и считай.',
  cintro:  'Это часы. Послушай, который час.',
  cpick:   'Который час? Выбери ответ.',
  chear:   'Послушай и найди нужные часы.',
  mcount:  'Сколько монеток? Посчитай.',
  ointro:  'Это противоположности — слова наоборот.',
  opick:   'Найди противоположное слово.',
  cmp:     'Послушай вопрос и нажми на нужную картинку.',
  mystory: 'Придумай свою историю! Выбирай героя, цвет и место.',
  chat:    'Поболтай с питомцем по-английски!',
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
  {id:'xtree',   type:'fun',  en:'Christmas tree', ru:'ёлка', icon:'🎄', price:50,  pos:[48,22,2.2], ny:true},
  {id:'xgift',   type:'fun',  en:'gift',       ru:'подарок',  icon:'🎁', price:15,  pos:[56,1,.9],   ny:true},
  {id:'xbell',   type:'fun',  en:'bell',       ru:'колокольчик', icon:'🔔', price:20, pos:[70,80,.9], ny:true},
  {id:'xcandle', type:'fun',  en:'candle',     ru:'свеча',    icon:'🕯️', price:15,  pos:[12,40,.8],  ny:true},
  {id:'snowman', type:'fun',  en:'snowman',    ru:'снеговик', icon:'⛄', price:40,  yard:true,       ny:true},
  {id:'xsanta',  type:'fun',  en:'Santa',      ru:'Дед Мороз', icon:'🎅', price:80, pos:[78,22,1.3], ny:true},
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
const EXTRA = [...STORY_BITS, "What time is it?", ...CLOCK_HOURS.map((_, i) => TIME_SAY(i + 1)), 'coins', 'Here you are', 'How many coins?',
  ...OPPOSITES.flatMap(o => [o.a.en, o.b.en]), ...COMPARE.map(c => c.q), ...Object.values(STORY_PARTS).flat(), 'bowl', 'leash', 'books', 'shop', 'star', 'guitar', 'tent', 'rocket', 'boat', 'bike', 'fountain', 'castle',
  'sit', 'jump', 'good dog', 'Happy New Year', ...COMMANDS.flatMap(c => [c.en, 'please ' + c.en]), 'yummy', "let's go for a walk", 'good night', ...CARDS.map(c => c.en)];
const WALLS = [
  {id:'',       ru:'обычные',                   price:0,  css:'linear-gradient(#fdf1dc,#f8e3c0)', dot:'#f8e3c0'},
  {id:'blue',   en:'blue',   ru:'синие',        price:30, css:'linear-gradient(#cfe6ff,#a9d0ff)', dot:'#3b82f6'},
  {id:'green',  en:'green',  ru:'зелёные',      price:30, css:'linear-gradient(#d9f7e0,#b4ecc3)', dot:'#22c55e'},
  {id:'yellow', en:'yellow', ru:'жёлтые',       price:30, css:'linear-gradient(#fff6c2,#ffe98a)', dot:'#facc15'},
  {id:'purple', en:'purple', ru:'фиолетовые',   price:30, css:'linear-gradient(#ead9ff,#d3b6ff)', dot:'#a855f7'},
];
const FREEZE_PRICE = 30, FREEZE_MAX = 2;

const AVATARS =['👧','👦','🧒','👩','👨','👵','👴','🦸'];
