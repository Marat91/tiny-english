CHARACTERS.push({
  id: 'cat', name: 'Луна', kind: 'котёнок', emoji: '🐱', hello: 'Meow! Hello!', helloRu: 'Мяу! Привет!',
  svg: `
  <defs>
    <radialGradient id="ctFur" cx=".38" cy=".28" r=".95"><stop offset="0" stop-color="#ffd29a"/><stop offset=".7" stop-color="#f3a550"/><stop offset="1" stop-color="#dd8a36"/></radialGradient>
    <radialGradient id="ctEye" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#b6ec7a"/><stop offset="1" stop-color="#5aa832"/></radialGradient>
  </defs>
  <ellipse cx="120" cy="256" rx="74" ry="7" fill="#23324a" opacity=".12"/>
  <g class="tail">
    <path d="M166 238 C206 240 216 204 198 180" stroke="#ee9d45" stroke-width="13" stroke-linecap="round" fill="none"/>
    <path d="M207 214 l-10 3 M209 200 l-10 0" stroke="#c9772b" stroke-width="4" stroke-linecap="round"/>
  </g>
  <path d="M74 252 C62 202 84 150 120 150 C156 150 178 202 166 252 Z" fill="url(#ctFur)"/>
  <path d="M99 252 C92 214 102 178 120 178 C138 178 148 214 141 252 Z" fill="#fff3dc"/>
  <ellipse cx="81" cy="248" rx="20" ry="10" fill="#ea9a44"/>
  <ellipse cx="159" cy="248" rx="20" ry="10" fill="#ea9a44"/>
  <rect x="100" y="198" width="18" height="54" rx="9" fill="#fbc988"/>
  <rect x="122" y="198" width="18" height="54" rx="9" fill="#fbc988"/>
  <ellipse cx="109" cy="249" rx="12" ry="8" fill="#fff6e6"/>
  <ellipse cx="131" cy="249" rx="12" ry="8" fill="#fff6e6"/>

  <path d="M68 74 L62 18 L112 50 Z" fill="#e8943e"/><path d="M75 62 L72 34 L99 51 Z" fill="#ffc2c8"/>
  <path d="M172 74 L178 18 L128 50 Z" fill="#e8943e"/><path d="M165 62 L168 34 L141 51 Z" fill="#ffc2c8"/>
  <ellipse cx="120" cy="95" rx="59" ry="53" fill="url(#ctFur)"/>
  <path d="M120 44 v17 M105 47 l3 15 M135 47 l-3 15" stroke="#c9772b" stroke-width="5" stroke-linecap="round"/>
  <path d="M63 90 h13 M65 103 h13 M177 90 h-13 M175 103 h-13" stroke="#c9772b" stroke-width="4.5" stroke-linecap="round"/>
  <ellipse cx="120" cy="119" rx="26" ry="18" fill="#fff6e6"/>

  <ellipse cx="96" cy="86" rx="10" ry="11" fill="url(#ctEye)"/><ellipse cx="96" cy="86" rx="3.8" ry="9.4" fill="#1d1d1d"/>
  <circle cx="99.6" cy="81.6" r="2.8" fill="#fff"/>
  <ellipse cx="144" cy="86" rx="10" ry="11" fill="url(#ctEye)"/><ellipse cx="144" cy="86" rx="3.8" ry="9.4" fill="#1d1d1d"/>
  <circle cx="147.6" cy="81.6" r="2.8" fill="#fff"/>

  <path d="M113 108 h14 l-7 8 z" fill="#ff8fa3" stroke="#ff8fa3" stroke-width="2" stroke-linejoin="round"/>
  <path d="M120 116 v4 M120 120 q-7 8 -15 2 M120 120 q7 8 15 2" stroke="#6b3d1a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M100 117 L62 111 M100 122 L62 126 M140 117 L178 111 M140 122 L178 126" stroke="#7a4a22" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  `,
});
