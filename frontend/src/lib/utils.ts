import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps bank enum to a color
 * @param bankEnum - Bank enum name (e.g., "INTER", "PICPAY", "UNKNOWN")
 * @returns Color hex code
 */
export function getBankColor(bankEnum?: string): string {
  if (bankEnum) {
    switch (bankEnum.toUpperCase()) {
      case "INTER":
        return "#FF6B35"; // Orange
      case "PICPAY":
        return "#20C997"; // Green
      default:
        return "#6B7280"; // Gray for unknown/other banks
    }
  }

  // Default color if not provided
  return "#6B7280"; // Gray
}

/**
 * Formats a number as Brazilian currency (R$)
 * @param value - The number to format
 * @returns Formatted string like "R$ 103.240,08"
 */
export function formatBrazilianCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}