/* ── SEO Post Types ── */

export type SeoPostStatus = "draft" | "published" | "error";

export interface SeoPost {
  id: string;
  user_id: string;
  title: string;
  slug: string | null;
  meta_description: string | null;
  category: string | null;
  html_content: string | null;
  word_count: number;
  featured_image_url: string | null;
  target_keywords: string[];
  internal_links_used: number;
  website_url: string | null;
  publish_url: string | null;
  status: SeoPostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SeoPostInsert {
  user_id: string;
  title: string;
  slug?: string | null;
  meta_description?: string | null;
  category?: string | null;
  html_content?: string | null;
  word_count?: number;
  featured_image_url?: string | null;
  target_keywords?: string[];
  internal_links_used?: number;
  website_url?: string | null;
  publish_url?: string | null;
  status?: SeoPostStatus;
  published_at?: string | null;
}

export interface SeoPostStats {
  total: number;
  draft: number;
  published: number;
  error: number;
  total_words: number;
  categories: string[];
  posts_per_week: { week: string; count: number }[];
  posts_per_category: { category: string; count: number }[];
}

export const SEO_STATUS_CONFIG: Record<
  SeoPostStatus,
  { label: string; className: string; dot: string }
> = {
  draft:     { label: "Entwurf",        className: "bg-amber-500/10 text-amber-700 border border-amber-500/15",       dot: "bg-amber-500" },
  published: { label: "Veröffentlicht", className: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/15", dot: "bg-emerald-500" },
  error:     { label: "Fehler",         className: "bg-destructive/10 text-destructive border border-destructive/15", dot: "bg-destructive" },
};
