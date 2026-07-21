/**
 * Decides whether the provider display-name field may be overwritten by an
 * auto-fill (selecting a preset, or switching the provider-type tab).
 *
 * A name is considered auto-filled — and therefore safe to replace — when it is
 * blank or still equals the last preset-provided label. Once the user types a
 * name that differs from the last applied preset, it is treated as user-owned
 * and preserved.
 *
 * @param current the current value of the display-name field
 * @param lastPresetName the label of the most recently applied preset, or null
 */
export function isAutoFilledName(
  current: string,
  lastPresetName: string | null
): boolean {
  return current.trim() === '' || current === lastPresetName;
}
