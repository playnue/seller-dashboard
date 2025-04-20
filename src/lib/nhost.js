import { NhostClient } from "@nhost/nextjs";

const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN;
const region = process.env.NEXT_PUBLIC_NHOST_REGION;

if (!subdomain || !region) {
  throw new Error("Missing Nhost configuration: subdomain or region is not set.");
}

export const nhost = new NhostClient({
  subdomain,
  region,
  autoRefreshToken: true,
  autoSignIn: true,
});
