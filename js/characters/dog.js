CHARACTERS.push({
  id: 'dog', name: 'Бадди', kind: 'щенок', emoji: '🐶', hello: 'Woof! Hello!', helloRu: 'Гав! Привет!',
  svg: `
  <defs>
    <radialGradient id="dgFur" cx=".38" cy=".28" r=".95"><stop offset="0" stop-color="#fbdcab"/><stop offset=".7" stop-color="#e6ad66"/><stop offset="1" stop-color="#cf9350"/></radialGradient>
    <radialGradient id="dgEar" cx=".35" cy=".2" r="1"><stop offset="0" stop-color="#a9703f"/><stop offset="1" stop-color="#683f20"/></radialGradient>
    <radialGradient id="dgEye" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#6b4223"/><stop offset=".55" stop-color="#2b1a10"/></radialGradient>
  </defs>
  <ellipse cx="120" cy="256" rx="74" ry="7" fill="#23324a" opacity=".12"/>
  <g class="tail">
    <path d="M164 224 C196 220 208 196 201 170" stroke="#dfa35a" stroke-width="15" stroke-linecap="round" fill="none"/>
    <path d="M203 180 C203 176 202 173 201 170" stroke="#fff6e6" stroke-width="13" stroke-linecap="round" fill="none"/>
  </g>
  <path d="M72 252 C60 200 82 148 120 148 C158 148 180 200 168 252 Z" fill="url(#dgFur)"/>
  <path d="M97 252 C90 212 101 174 120 174 C139 174 150 212 143 252 Z" fill="#fff3dc"/>
  <ellipse cx="79" cy="248" rx="21" ry="10.5" fill="#e3aa62"/>
  <ellipse cx="161" cy="248" rx="21" ry="10.5" fill="#e3aa62"/>
  <rect x="98" y="196" width="20" height="56" rx="10" fill="#f4cc92"/>
  <rect x="122" y="196" width="20" height="56" rx="10" fill="#f4cc92"/>
  <ellipse cx="108" cy="249" rx="13" ry="8.5" fill="#fff6e6"/>
  <ellipse cx="132" cy="249" rx="13" ry="8.5" fill="#fff6e6"/>
  <path d="M104 246 v6 M112 246 v6 M128 246 v6 M136 246 v6" stroke="#d9b98e" stroke-width="1.6" stroke-linecap="round"/>

  <ellipse cx="120" cy="95" rx="58" ry="55" fill="url(#dgFur)"/>
  <path d="M150 60 C171 64 178 92 163 107 C150 114 133 101 133 84 C133 71 139 60 150 60 Z" fill="#c4833f" opacity=".85"/>
  <path d="M120 40 C109 58 111 86 120 102 C129 86 131 58 120 40 Z" fill="#fff6e6"/>
  <path d="M78 56 C44 48 28 96 45 139 C49 150 62 148 66 137 C75 112 86 86 86 64 Z" fill="url(#dgEar)"/>
  <path d="M162 56 C196 48 212 96 195 139 C191 150 178 148 174 137 C165 112 154 86 154 64 Z" fill="url(#dgEar)"/>
  <ellipse cx="120" cy="121" rx="32" ry="25" fill="#fff6e6"/>

  <ellipse cx="96" cy="86" rx="8.8" ry="10.2" fill="url(#dgEye)"/>
  <circle cx="99.2" cy="82" r="3.2" fill="#fff"/><circle cx="93.4" cy="90.6" r="1.4" fill="#fff" opacity=".8"/>
  <ellipse cx="144" cy="86" rx="8.8" ry="10.2" fill="url(#dgEye)"/>
  <circle cx="147.2" cy="82" r="3.2" fill="#fff"/><circle cx="141.4" cy="90.6" r="1.4" fill="#fff" opacity=".8"/>
  <path d="M85 70 q10 -7 19 -1" stroke="#b9793b" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M136 69 q9 -6 19 1" stroke="#8a5529" stroke-width="3" fill="none" stroke-linecap="round"/>

  <path d="M111 131 q9 22 18 0 z" fill="#ff7b8a"/>
  <path d="M120 133 v9" stroke="#e85d6f" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M120 120 v7 M120 127 q-9 10 -21 3 M120 127 q9 10 21 3" stroke="#2b1a10" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M106 106 Q120 97 134 106 Q135 117 120 121 Q105 117 106 106 Z" fill="#2b1a10"/>
  <ellipse cx="115" cy="106" rx="5" ry="2.3" fill="#fff" opacity=".35"/>
  <g fill="#cfae84"><circle cx="103" cy="119" r="1.4"/><circle cx="99" cy="125" r="1.4"/><circle cx="137" cy="119" r="1.4"/><circle cx="141" cy="125" r="1.4"/></g>
  `,
});
