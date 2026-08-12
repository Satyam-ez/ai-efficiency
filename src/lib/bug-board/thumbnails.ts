/**
 * Seeded evidence has to look like a real screenshot without shipping binary
 * assets, so previews are generated as inline SVG data URIs. Uploaded files use
 * object URLs instead and never come through here.
 */

type Tone = "neutral" | "error";

const INK = {
  chrome: "#e8e8e8",
  surface: "#fafafa",
  panel: "#f1f1f1",
  line: "#dcdcdc",
  text: "#c4c4c4",
  strongText: "#9a9a9a",
  error: "#e0b4ab",
  errorFill: "#fbf1ee",
  errorText: "#b4543a",
} as const;

function encode(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    svg.replace(/\s{2,}/g, " ").trim()
  )}`;
}

function rows(count: number, x: number, y: number, width: number): string {
  return Array.from({ length: count }, (_, index) => {
    const rowY = y + index * 26;
    const fill = index % 3 === 0 ? INK.strongText : INK.text;
    return `<rect x="${x}" y="${rowY}" width="${width - (index % 4) * 40}" height="8" rx="4" fill="${fill}" opacity="0.5"/>
      <rect x="${x + width + 24}" y="${rowY}" width="64" height="8" rx="4" fill="${INK.text}" opacity="0.4"/>`;
  }).join("");
}

/** A fake product screenshot, optionally with an error banner across the top. */
export function screenshotDataUri(label: string, tone: Tone = "neutral"): string {
  const banner =
    tone === "error"
      ? `<rect x="216" y="88" width="720" height="44" rx="8" fill="${INK.errorFill}" stroke="${INK.error}"/>
         <circle cx="242" cy="110" r="8" fill="${INK.errorText}" opacity="0.75"/>
         <text x="262" y="115" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" fill="${INK.errorText}">${label}</text>`
      : `<rect x="216" y="88" width="720" height="44" rx="8" fill="${INK.panel}" stroke="${INK.line}"/>
         <text x="236" y="115" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" fill="${INK.strongText}">${label}</text>`;

  return encode(`
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600" role="img" aria-label="${label}">
      <rect width="960" height="600" fill="${INK.surface}"/>
      <rect width="960" height="40" fill="${INK.chrome}"/>
      <circle cx="24" cy="20" r="6" fill="#cfcfcf"/><circle cx="44" cy="20" r="6" fill="#dcdcdc"/><circle cx="64" cy="20" r="6" fill="#dcdcdc"/>
      <rect x="96" y="12" width="300" height="16" rx="8" fill="${INK.surface}"/>
      <rect x="0" y="40" width="192" height="560" fill="${INK.panel}"/>
      ${Array.from({ length: 8 }, (_, index) => `<rect x="24" y="${76 + index * 34}" width="${index === 1 ? 120 : 104}" height="10" rx="5" fill="${index === 1 ? INK.strongText : INK.text}" opacity="${index === 1 ? 0.7 : 0.45}"/>`).join("")}
      ${banner}
      <rect x="216" y="156" width="344" height="120" rx="10" fill="#ffffff" stroke="${INK.line}"/>
      <rect x="592" y="156" width="344" height="120" rx="10" fill="#ffffff" stroke="${INK.line}"/>
      <rect x="240" y="184" width="96" height="10" rx="5" fill="${INK.text}"/>
      <rect x="240" y="210" width="150" height="22" rx="6" fill="${INK.strongText}" opacity="0.35"/>
      <rect x="616" y="184" width="96" height="10" rx="5" fill="${INK.text}"/>
      <rect x="616" y="210" width="180" height="22" rx="6" fill="${INK.strongText}" opacity="0.35"/>
      <rect x="216" y="300" width="720" height="272" rx="10" fill="#ffffff" stroke="${INK.line}"/>
      <rect x="216" y="300" width="720" height="40" rx="10" fill="${INK.panel}"/>
      <rect x="240" y="316" width="80" height="8" rx="4" fill="${INK.strongText}" opacity="0.6"/>
      ${rows(7, 240, 366, 420)}
    </svg>
  `);
}

/** Poster frame for a recording: the same screenshot plus player affordances. */
export function recordingPosterDataUri(label: string): string {
  return encode(`
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600" role="img" aria-label="${label}">
      <rect width="960" height="600" fill="#1c1c1c"/>
      <rect x="40" y="32" width="880" height="480" rx="12" fill="${INK.surface}"/>
      <rect x="40" y="32" width="880" height="36" rx="12" fill="${INK.chrome}"/>
      <circle cx="66" cy="50" r="5" fill="#cfcfcf"/><circle cx="84" cy="50" r="5" fill="#dcdcdc"/><circle cx="102" cy="50" r="5" fill="#dcdcdc"/>
      <rect x="72" y="104" width="220" height="376" rx="8" fill="${INK.panel}"/>
      ${rows(6, 328, 132, 380)}
      <rect x="328" y="320" width="560" height="160" rx="10" fill="#ffffff" stroke="${INK.line}"/>
      <circle cx="480" cy="272" r="52" fill="#000000" opacity="0.55"/>
      <path d="M462 246 L512 272 L462 298 Z" fill="#ffffff"/>
      <rect x="40" y="540" width="880" height="6" rx="3" fill="#3a3a3a"/>
      <rect x="40" y="540" width="286" height="6" rx="3" fill="#d4d4d4"/>
      <text x="40" y="580" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" fill="#8f8f8f">${label}</text>
    </svg>
  `);
}
