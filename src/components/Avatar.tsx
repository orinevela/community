/* eslint-disable @next/next/no-img-element */
const TONES = ["#0d7a5f", "#e0703a", "#5b6bd6", "#b5487a", "#2f8fb5", "#8a6d1f"];

export function Avatar({ name, photo, size = 48 }: { name: string; photo?: string | null; size?: number }) {
  if (photo) {
    return <img src={photo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  const tone = TONES[[...(name || "?")].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: tone, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
