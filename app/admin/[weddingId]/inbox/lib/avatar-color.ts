// Deterministic pastel avatar color per contact/guest — the same person gets
// the same color across the conversation list, thread header, and guest
// panel, which helps a host recognize who they're looking at at a glance.
// Same bg-100/text-700 pairing already used by StatusPill, so it reads as
// part of the same system rather than a new palette.
const AVATAR_PALETTE = [
  { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-300/60" },
  { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-300/60" },
  { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300/60" },
  { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-300/60" },
  { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-300/60" },
  { bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-300/60" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700", ring: "ring-fuchsia-300/60" },
  { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-300/60" },
] as const

export function avatarPalette(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}
