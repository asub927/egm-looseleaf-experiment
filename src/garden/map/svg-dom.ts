const SVG_NS = "http://www.w3.org/2000/svg"

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v))
}

export function el(
  tag: string,
  attrs: Record<string, string | number> | null,
  parent: Element,
): SVGElement {
  const e = document.createElementNS(SVG_NS, tag)
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      e.setAttribute(k, String(attrs[k]))
    }
  }
  parent.appendChild(e)
  return e
}

export function svgIn(
  parent: SVGSVGElement,
  x: number,
  y: number,
  sc: number,
  html: string,
  extra?: Record<string, string | number>,
): SVGGElement {
  const g = el(
    "g",
    { transform: `translate(${x} ${y}) scale(${sc})`, ...(extra ?? {}) },
    parent,
  ) as SVGGElement
  g.innerHTML = html
  return g
}
