import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 4) - hash);
  }
  return hash;
};

export const nameToColor = (name: string) => {
  const hash = hashString(name);
  const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "000000".substring(0, 6 - color.length) + color;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
