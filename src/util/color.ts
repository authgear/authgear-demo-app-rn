export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

// Black or white, whichever reads better on the given background.
export function contrastingTextColor(backgroundColor: string): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(backgroundColor.trim());
  if (m == null) {
    return '#000000';
  }
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
