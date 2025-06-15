export function validate(
  explen: number,
  ...args: (string | undefined)[]
): boolean {
  if (args.length !== explen) return false;
  for (const arg of args) {
    if (!arg) return false;
    if (arg.trim().length === 0) return false;
  }
  return true;
}
