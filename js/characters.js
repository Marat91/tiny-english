/* Персонажи. Каждый лежит в своём файле js/characters/<имя>.js и добавляет себя в CHARACTERS.
   Все нарисованы на одном холсте 240×264, голова в одном и том же месте (глаза в точках 96,86 и 144,86),
   поэтому подарки (ошейник, бантик, очки, корона) общие и подходят всем. */
const CHARACTERS = [];

/* Слово в нужном роде: gw(персонаж, 'рад', 'рада') — у персонажа-девочки стоит f: true */
const gw = (c, m, f) => c && c.f ? f : m;
function petById(id){ return CHARACTERS.find(c => c.id === id) || CHARACTERS[0] }

/* Заранее подгружаем позы «радуется» и «грустит», чтобы они менялись без задержки */
function preloadPets(){
  CHARACTERS.forEach(c => c.img && Object.values(c.img).forEach(src => { new Image().src = src }));
}

/* gs — размер по возрасту питомца (1 — взрослый); класс low — грустная поза, jump — радостная */
function petSVG(id, stars, cls, gs){
  const c = petById(id), has = n => stars >= TOYS[n].at;
  if (c.img){
    /* Персонаж-картинка: подарки показываем значками под ним */
    const toys = TOYS.filter(t => stars >= t.at).map(t => t.icon).join('');
    const pose = /\bjump\b/.test(cls || '') ? c.img.happy : /\blow\b/.test(cls || '') ? c.img.sad : c.img.idle;
    return `<div class="pet pic ${cls || ''}" role="img" aria-label="${c.name}" data-char="${c.id}" style="--gs:${gs || 1}">
      <i class="sh"></i><img src="${pose}" alt="" draggable="false" width="640" height="640" style="max-width:100%;height:auto">${toys ? `<span class="toys">${toys}</span>` : ''}</div>`;
  }
  return `<svg class="pet ${cls || ''}" viewBox="0 -18 240 284" role="img" aria-label="${c.name}">
    ${c.svg}
    ${has(0) ? `<path d="M86 146 q34 20 68 0" stroke="#e5484d" stroke-width="10" fill="none" stroke-linecap="round"/>
                <circle cx="120" cy="161" r="7.5" fill="#ffd43b" stroke="#e0a800" stroke-width="2"/>` : ''}
    ${has(1) ? `<g transform="translate(76 50) rotate(-20)"><path d="M0 0 l-19 -13 v26 z M0 0 l19 -13 v26 z" fill="#ff8fab"/><circle r="6.5" fill="#ff5c8a"/></g>` : ''}
    ${has(2) ? `<g fill="#23324a"><rect x="79" y="74" width="34" height="24" rx="9"/><rect x="127" y="74" width="34" height="24" rx="9"/><rect x="111" y="81" width="18" height="5"/></g>
                <path d="M85 80 l8 -3 M133 80 l8 -3" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>` : ''}
    ${has(3) ? `<path d="M90 46 l6 -30 l14 18 l10 -26 l10 26 l14 -18 l6 30 z" fill="#ffd43b" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/>
                <circle cx="120" cy="34" r="4" fill="#ff5c8a"/>` : ''}
  </svg>`;
}
