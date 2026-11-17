/** Garden map scenery SVG fragments (demo DECOR). */

export const DECOR = {
  gate(w: number): string {
    const h = w * 1.05
    const p = w * 0.5
    let s = ""
    s += `<path d="M${-p - w * 0.62} -4 H${-p} M${p} -4 H${p + w * 0.62} M${-p - w * 0.62} ${-h * 0.45} H${-p} M${p} ${-h * 0.45} H${p + w * 0.62}" stroke="#C9A36B" stroke-width="3" stroke-linecap="round"/>`
    for (let i = 1; i <= 3; i++) {
      const fx = p + i * w * 0.18
      s += `<path d="M${fx - 3} -1 V${-h * 0.62} l3 -4 l3 4 V-1 Z M${-fx - 3} -1 V${-h * 0.62} l3 -4 l3 4 V-1 Z" fill="#FFF8F0" stroke="#2B2A3A" stroke-width="1.3" stroke-linejoin="round"/>`
    }
    s += `<path d="M${-p - 4} 0 V${-h} h8 V0 Z M${p - 4} 0 V${-h} h8 V0 Z" fill="#E3C79B" stroke="#2B2A3A" stroke-width="1.6" stroke-linejoin="round"/>`
    s += `<circle cx="${-p}" cy="${-h - 4}" r="5" fill="#FFD6C9" stroke="#2B2A3A" stroke-width="1.5"/><circle cx="${p}" cy="${-h - 4}" r="5" fill="#FFD6C9" stroke="#2B2A3A" stroke-width="1.5"/>`
    s += `<path d="M${-p + 4} -3 L${-p + w * 0.3} 2 L${-p + w * 0.3} ${-h * 0.55} L${-p + 4} ${-h * 0.66} Z M${p - 4} -3 L${p - w * 0.3} 2 L${p - w * 0.3} ${-h * 0.55} L${p - 4} ${-h * 0.66} Z" fill="#FFF8F0" stroke="#2B2A3A" stroke-width="1.4" stroke-linejoin="round"/>`
    s += `<path d="M${-p + w * 0.16} 0 V${-h * 0.58} M${p - w * 0.16} 0 V${-h * 0.58}" stroke="#2B2A3A" stroke-width="1" opacity=".45"/>`
    return s
  },
  arbor(w: number): string {
    const h = w * 1.35
    const p = w * 0.5
    let s = ""
    s += `<path d="M${-p} 0 V${-h * 0.7} A${p} ${h * 0.3} 0 0 1 ${p} ${-h * 0.7} V0" fill="none" stroke="#2B2A3A" stroke-width="9" stroke-linecap="round" opacity=".9"/>`
    s += `<path d="M${-p} 0 V${-h * 0.7} A${p} ${h * 0.3} 0 0 1 ${p} ${-h * 0.7} V0" fill="none" stroke="#FFF8F0" stroke-width="6" stroke-linecap="round"/>`
    s += `<path d="M${-p} -4 C${-p - 6} ${-h * 0.3} ${-p + 6} ${-h * 0.5} ${-p} ${-h * 0.8} S ${-p * 0.3} ${-h} 0 ${-h * 0.99} S ${p} ${-h * 0.85} ${p} ${-h * 0.6} S ${p + 6} ${-h * 0.2} ${p} -4" fill="none" stroke="#5FAE6A" stroke-width="2" stroke-linecap="round"/>`
    const spots: [number, number][] = [
      [-p, -h * 0.22],
      [-p - 2, -h * 0.48],
      [-p + 2, -h * 0.76],
      [-p * 0.55, -h * 0.95],
      [0, -h * 1.0],
      [p * 0.55, -h * 0.95],
      [p - 1, -h * 0.72],
      [p + 2, -h * 0.45],
      [p, -h * 0.2],
    ]
    for (let i = 0; i < spots.length; i++) {
      const x = spots[i][0]
      const y = spots[i][1]
      s += `<ellipse cx="${x + (i % 2 ? 5 : -5)}" cy="${y + 3}" rx="5" ry="2.6" fill="#7BC47F" stroke="#2B2A3A" stroke-width="1" transform="rotate(${i % 2 ? 30 : -30} ${x + (i % 2 ? 5 : -5)} ${y + 3})"/>`
      if (i % 2 === 0 || i === 4) {
        s += `<circle cx="${x}" cy="${y}" r="4.6" fill="${i % 4 === 0 ? "#FFD1E3" : "#FFD6C9"}" stroke="#2B2A3A" stroke-width="1.2"/><path d="M${x - 1.6} ${y} a1.6 1.6 0 1 1 3.2 0" fill="none" stroke="#2B2A3A" stroke-width=".9"/>`
      }
    }
    return s
  },
  shed(): string {
    return (
      '<path d="M-30 0 V-34 L0 -56 L30 -34 V0 Z" fill="#FFF8F0" stroke="#2B2A3A" stroke-width="1.8" stroke-linejoin="round"/>' +
      '<path d="M-36 -32 L0 -60 L36 -32" fill="none" stroke="#2B2A3A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M-36 -32 L0 -60 L36 -32" fill="none" stroke="#FFD6C9" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect x="-9" y="-26" width="18" height="26" rx="2" fill="#D9CCFF" stroke="#2B2A3A" stroke-width="1.5"/><circle cx="5" cy="-13" r="1.3" fill="#2B2A3A"/>' +
      '<circle cx="0" cy="-41" r="5.5" fill="#CDE8FF" stroke="#2B2A3A" stroke-width="1.4"/><path d="M0 -46.5 V-35.5 M-5.5 -41 H5.5" stroke="#2B2A3A" stroke-width="1"/>' +
      '<path d="M-24 -6 q2 -9 4 0 M18 -6 q3 -10 5 0" fill="#7BC47F" stroke="#2B2A3A" stroke-width="1.1"/><circle cx="-22" cy="-12" r="2.6" fill="#FFD1E3" stroke="#2B2A3A" stroke-width="1"/><circle cx="21" cy="-13" r="2.6" fill="#FFF1B8" stroke="#2B2A3A" stroke-width="1"/>'
    )
  },
  bench(): string {
    return (
      '<ellipse cx="0" cy="0" rx="34" ry="4" fill="#2B2A3A" opacity=".07"/>' +
      '<path d="M-24 -1 V-14 M24 -1 V-14 M-22 -14 V-30 M22 -14 V-30" stroke="#2B2A3A" stroke-width="2.4" stroke-linecap="round"/>' +
      '<rect x="-30" y="-34" width="60" height="7" rx="3" fill="#E3C79B" stroke="#2B2A3A" stroke-width="1.5"/><rect x="-30" y="-25" width="60" height="5" rx="2.5" fill="#E3C79B" stroke="#2B2A3A" stroke-width="1.3"/>' +
      '<rect x="-32" y="-17" width="64" height="6" rx="3" fill="#D4B98F" stroke="#2B2A3A" stroke-width="1.5"/>'
    )
  },
  canRest(): string {
    return (
      '<ellipse cx="0" cy="0" rx="20" ry="3" fill="#2B2A3A" opacity=".07"/>' +
      '<path d="M-14 0 V-14 M14 0 V-14" stroke="#2B2A3A" stroke-width="2.2" stroke-linecap="round"/><rect x="-17" y="-18" width="34" height="5" rx="2.5" fill="#D4B98F" stroke="#2B2A3A" stroke-width="1.4"/>' +
      '<g transform="translate(-8 -18)"><rect x="0" y="-15" width="15" height="15" rx="3" fill="#CDE8FF" stroke="#2B2A3A" stroke-width="1.5"/><path d="M15 -11 l9 -6 l1.6 2.2 l-9 6" fill="#CDE8FF" stroke="#2B2A3A" stroke-width="1.4" stroke-linejoin="round"/><path d="M2 -15 q5.5 -8 11 0" fill="none" stroke="#2B2A3A" stroke-width="1.6"/></g>' +
      '<path d="M-17 -0.5 h-8 v-6 h8" fill="#C9A36B" stroke="#2B2A3A" stroke-width="1.2" stroke-linejoin="round"/>'
    )
  },
  pond(): string {
    return (
      '<ellipse cx="0" cy="-14" rx="52" ry="16" fill="#F3E6C8" stroke="#2B2A3A" stroke-width="1.4" stroke-opacity=".6"/>' +
      '<ellipse cx="0" cy="-14" rx="45" ry="12" fill="#CDE8FF"/><path d="M-30 -16 q8 -3 16 0 M6 -10 q8 -3 16 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M14 -18 a6 3.4 0 1 0 5 -3 l-4 3 Z" fill="#7BC47F" stroke="#2B2A3A" stroke-width="1"/><circle cx="-20" cy="-9" r="3" fill="#FFD1E3" stroke="#2B2A3A" stroke-width="1"/><path d="M-26 -8 a5 2.8 0 1 0 4 -3" fill="#7BC47F" stroke="#2B2A3A" stroke-width="1"/>' +
      '<path d="M-50 -14 q-4 -14 -1 -20 M-46 -14 q2 -12 6 -16" stroke="#5FAE6A" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="-51" cy="-34" rx="1.8" ry="4" fill="#B98A5E"/>' +
      '<ellipse cx="62" cy="-4" rx="9" ry="4" fill="#EFE6D8" stroke="#2B2A3A" stroke-width="1.1" stroke-opacity=".6"/><ellipse cx="78" cy="2" rx="8" ry="3.6" fill="#EFE6D8" stroke="#2B2A3A" stroke-width="1.1" stroke-opacity=".6"/>'
    )
  },
  flowers(c: string): string {
    return (
      '<path d="M-8 0 q-1 -7 -3 -9 M0 0 V-12 M8 0 q1 -7 3 -9" stroke="#5FAE6A" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      `<circle cx="-11" cy="-10" r="3.2" fill="${c}" stroke="#2B2A3A" stroke-width="1"/><circle cx="0" cy="-14" r="3.6" fill="#fff" stroke="#2B2A3A" stroke-width="1"/><circle cx="11" cy="-10" r="3.2" fill="${c}" stroke="#2B2A3A" stroke-width="1"/><circle cx="0" cy="-14" r="1.3" fill="#FFD66E"/>`
    )
  },
  tree(c: string): string {
    return (
      '<path d="M-3 0 V-26 M3 0 V-26" stroke="#C9A36B" stroke-width="3" stroke-linecap="round"/>' +
      `<circle cx="0" cy="-36" r="20" fill="${c}"/><circle cx="-14" cy="-26" r="13" fill="${c}"/><circle cx="14" cy="-27" r="13" fill="${c}"/>` +
      '<circle cx="-6" cy="-42" r="6" fill="#fff" opacity=".22"/>'
    )
  },
  bush(): string {
    return '<ellipse cx="0" cy="-9" rx="20" ry="10" fill="#A8D5A2" stroke="#2B2A3A" stroke-width="1.2" stroke-opacity=".55"/><ellipse cx="-9" cy="-13" rx="10" ry="8" fill="#B9E3C3" stroke="#2B2A3A" stroke-width="1.2" stroke-opacity=".55"/><ellipse cx="8" cy="-14" rx="11" ry="9" fill="#B9E3C3" stroke="#2B2A3A" stroke-width="1.2" stroke-opacity=".55"/>'
  },
} as const

export type DecorName = keyof typeof DECOR
