import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DemandCategory, SourcePlatform } from "@/types/demand";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "Baru saja";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Baru saja";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
  if (diffInSeconds < 172800) return "Kemarin";
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getPlatformMeta(platform: SourcePlatform) {
  const p = platform.toLowerCase();
  switch (p) {
    case "twitter":
    case "x":
      return {
        label: "Twitter / X",
        color: "bg-sky-500/10 text-sky-400 border-sky-500/20",
        badgeBg: "bg-sky-500",
      };
    case "telegram":
      return {
        label: "Telegram",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        badgeBg: "bg-blue-500",
      };
    case "facebook":
      return {
        label: "Facebook Group",
        color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        badgeBg: "bg-indigo-500",
      };
    case "reddit":
      return {
        label: "Reddit",
        color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        badgeBg: "bg-orange-500",
      };
    case "forum":
    case "kaskus":
      return {
        label: "Komunitas / Forum",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        badgeBg: "bg-purple-500",
      };
    default:
      return {
        label: platform.toUpperCase(),
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        badgeBg: "bg-emerald-500",
      };
  }
}

export function getCategoryMeta(category: DemandCategory) {
  switch (category) {
    case "barang":
      return {
        label: "Barang / Produk",
        color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
        dotColor: "bg-cyan-400",
      };
    case "jasa":
      return {
        label: "Jasa / Vendor",
        color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        dotColor: "bg-amber-400",
      };
    case "impor":
      return {
        label: "Impor / Forwarder",
        color: "bg-violet-500/10 text-violet-300 border-violet-500/30",
        dotColor: "bg-violet-400",
      };
    case "supplier":
      return {
        label: "Supplier / Pabrik",
        color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
        dotColor: "bg-emerald-400",
      };
    default:
      return {
        label: "Umum",
        color: "bg-slate-500/10 text-slate-300 border-slate-500/30",
        dotColor: "bg-slate-400",
      };
  }
}
