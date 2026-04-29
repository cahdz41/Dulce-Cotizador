import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateFolio(): string {
  return `PRE-${Date.now().toString().slice(-7)}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function fuzzyScore(query: string, product: { codigo: string; descripcion: string; grupo: string; subclasificacion: string }): number {
  const q = query.toLowerCase().trim();
  if (!q) return 100;
  const text = `${product.codigo} ${product.descripcion} ${product.grupo} ${product.subclasificacion}`.toLowerCase();

  if (text.includes(q)) {
    return 80 - text.indexOf(q);
  }

  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  let score = 0;
  for (const token of tokens) {
    if (text.includes(token)) {
      score += 50;
    } else if (text.includes(token.slice(0, -1))) {
      score += 20;
    } else {
      const words = text.split(/\s+/);
      for (const word of words) {
        if (lev(token, word) <= 2) {
          score += 15;
          break;
        }
      }
    }
  }
  return score;
}

export function normalizeStr(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
