// just figures out what a command means - Hero.jsx turns this into actual output
const TERMINAL_HELP_TEXT = "whoami, ls, cat about.md, contact, clear";

function resolveTerminalCommand(rawInput) {
  const normalized = rawInput.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "help" || normalized === "?") return { kind: "help" };
  if (normalized === "whoami") return { kind: "whoami" };
  if (normalized === "ls" || normalized === "ls -la") return { kind: "ls" };
  if (normalized === "cat about.md" || normalized === "about") return { kind: "about" };
  if (normalized === "contact") return { kind: "contact" };
  if (normalized === "clear") return { kind: "clear" };
  if (normalized === "sudo make me a sandwich") return { kind: "sudo" };
  return { kind: "unknown", input: normalized };
}

Object.assign(window, { TERMINAL_HELP_TEXT, resolveTerminalCommand });
