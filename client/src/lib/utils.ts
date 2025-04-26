import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format number with commas
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format timestamp to relative time (e.g., "2 min ago")
export function formatTimeAgo(timestamp: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

// Format multiplier with "x" suffix (e.g., "2.50x")
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(2)}x`;
}

// Generate random hex color for user avatars
export function getRandomColor(): string {
  const colors = [
    "#FF5757", // red
    "#4CD964", // green
    "#FFD700", // gold
    "#5AC8FA", // blue
    "#FF9500", // orange
    "#CC73E1", // purple
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Generate user initials from username
export function getUserInitials(username: string): string {
  if (!username) return "";
  return username.charAt(0).toUpperCase();
}

// Format profit with + or - sign and color class
export function formatProfit(profit: number): { text: string, colorClass: string } {
  if (profit > 0) {
    return {
      text: `+${formatNumber(profit)}`,
      colorClass: "text-secondary"
    };
  } else if (profit < 0) {
    return {
      text: formatNumber(profit),
      colorClass: "text-primary"
    };
  } else {
    return {
      text: "0",
      colorClass: "text-muted-foreground"
    };
  }
}

// Wait for specified milliseconds
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
