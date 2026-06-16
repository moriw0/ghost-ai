export interface MockProject {
  id: string;
  name: string;
  slug: string;
  isOwned: boolean;
  updatedAt: string;
}

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "1",
    name: "E-Commerce Platform",
    slug: "e-commerce-platform",
    isOwned: true,
    updatedAt: "2026-06-15",
  },
  {
    id: "2",
    name: "Auth Service",
    slug: "auth-service",
    isOwned: true,
    updatedAt: "2026-06-14",
  },
  {
    id: "3",
    name: "Data Pipeline",
    slug: "data-pipeline",
    isOwned: false,
    updatedAt: "2026-06-13",
  },
];

export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
