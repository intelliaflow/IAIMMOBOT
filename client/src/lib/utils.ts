import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, showFull: boolean = false): string {
  if (!address) return '';
  
  // Si on veut l'adresse complète, on la retourne telle quelle
  if (showFull) return address;
  
  // Sinon, on ne retourne que la ville
  const parts = address.split(',');
  // On cherche la partie qui contient le code postal (5 chiffres)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (/\d{5}/.test(part)) {
      // On prend la ville qui est généralement juste après le code postal
      const cityPart = parts[i].trim();
      const matches = cityPart.match(/\d{5}\s+(.+)/);
      if (matches && matches[1]) {
        return matches[1];
      }
      // Si on ne trouve pas la ville après le code postal, on prend juste la partie avec le code postal
      return cityPart;
    }
  }
  // Si on ne trouve pas de code postal, on retourne la première partie
  return parts[0].trim();
}
