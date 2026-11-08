const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const vercelSiteUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

export const SITE_URL = (configuredSiteUrl ?? vercelSiteUrl ?? "https://forma-oversized.vercel.app").replace(/\/$/, "");

export function absoluteUrl(path: string) {
  return new URL(path, `${SITE_URL}/`).toString();
}