import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function encodeFileUrl(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    url.pathname = url.pathname.split('/').map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');
    return url.toString();
  } catch {
    return fileUrl;
  }
}
