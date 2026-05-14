// Safe localStorage wrapper for private browsing / SSR
const memory: Record<string, string> = {};

export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory[key] ?? null;
  }
}

export function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    memory[key] = value;
  }
}
