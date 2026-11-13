CHARACTERS.push({
  id: 'bunny', name: 'Банни', kind: 'зайчонок', emoji: '🐰', hello: 'Hop hop! Hello!', helloRu: 'Прыг-скок! Привет!',
  svg: `
  <defs>
    <radialGradient id="bnFur" cx=".38" cy=".28" r=".95"><stop offset="0" stop-color="#f7f3ef"/><stop offset=".7" stop-color="#d8cfc7"/><stop offset="1" stop-color="#bfb3a9"/></radialGradient>
    <radialGradient id="bnEye" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#5a3a2a"/><stop offset=".55" stop-color="#24150e"/></radialGradient>
  </defs>
  <ellipse cx="120" cy="256" rx="74" ry="7" fill="#23324a" opacity=".12"/>
  <g class="tail"><circle cx="172" cy="232" r="14" fill="#ffffff" stroke="#d8cfc7" stroke-width="2"/></g>
  <path d="M74 252 C62 202 84 150 120 150 C156 150 178 202 166 252 Z" fill="url(#bnFur)"/>
  <path d="M99 252 C92 214 102 178 120 178 C138 178 148 214 141 252 Z" fill="#ffffff"/>
  <ellipse cx="78" cy="248" rx="24" ry="10.5" fill="#cfc4bb"/>
  <ellipse cx="162" cy="248" rx="24" ry="10.5" fill="#cfc4bb"/>
  <rect x="100" y="198" width="18" height="54" rx="9" fill="#ece6e0"/>
  <rect x="122" y="198" width="18" height="54" rx="9" fill="#ece6e0"/>
  <ellipse cx="109" cy="249" rx="12" ry="8" fill="#ffffff"/>
  <ellipse cx="131" cy="249" rx="12" ry="8" fill="#ffffff"/>

  <path d="M90 60 C72 22 78 -12 95 -12 C112 -12 114 24 110 56 Z" fill="#d8cfc7"/>
  <path d="M94 50 C84 24 87 0 95 0 C103 0 105 26 103 50 Z" fill="#ffc2c8"/>
  <path d="M150 60 C168 22 162 -12 145 -12 C128 -12 126 24 130 56 Z" fill="#d8cfc7"/>
  <path d="M146 50 C156 24 153 0 145 0 C137 0 135 26 137 50 Z" fill="#ffc2c8"/>
  <ellipse cx="120" cy="96" rx="57" ry="53" fill="url(#bnFur)"/>
  <ellipse cx="120" cy="120" rx="27" ry="19" fill="#ffffff"/>
  <circle cx="74" cy="110" r="9" fill="#ff9aa2" opacity=".45"/><circle cx="166" cy="110" r="9" fill="#ff9aa2" opacity=".45"/>

  <ellipse cx="96" cy="86" rx="8.8" ry="10.2" fill="url(#bnEye)"/>
  <circle cx="99.2" cy="82" r="3.2" fill="#fff"/><circle cx="93.4" cy="90.6" r="1.4" fill="#fff" opacity=".8"/>
  <ellipse cx="144" cy="86" rx="8.8" ry="10.2" fill="url(#bnEye)"/>
  <circle cx="147.2" cy="82" r="3.2" fill="#fff"/><circle cx="141.4" cy="90.6" r="1.4" fill="#fff" opacity=".8"/>

  <rect x="114" y="121" width="12" height="11" rx="2.5" fill="#fff" stroke="#c9beb5" stroke-width="1.5"/>
  <path d="M120 121 v11" stroke="#c9beb5" stroke-width="1.5"/>
  <path d="M114 107 h12 l-6 7 z" fill="#ff8fa3" stroke="#ff8fa3" stroke-width="2" stroke-linejoin="round"/>
  <path d="M120 114 v5 M120 119 q-7 7 -14 1 M120 119 q7 7 14 1" stroke="#6b5348" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M100 118 L64 113 M100 123 L64 128 M140 118 L176 113 M140 123 L176 128" stroke="#8f8279" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  `,
});
