import { isIP } from "node:net";
import dns from "node:dns/promises";

const PRIVATE_IPV4_PREFIXES = ["10.", "127.", "192.168.", "169.254.", "0."];

function isPrivateIPv4(ip: string): boolean {
  if (PRIVATE_IPV4_PREFIXES.some((prefix) => ip.startsWith(prefix))) return true;
  const parts = ip.split(".").map(Number);
  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
}

// Guards Stagehand's page.goto() against navigating to internal/private network targets.
// job.website comes from ITPro.lk's third-party API, not something we control — a malformed
// or malicious listing could point it at localhost/an internal IP/cloud metadata endpoint.
// Resolves the hostname via DNS rather than trusting the literal string, since a hostname
// that looks public can still resolve to a private address (DNS rebinding).
export async function isPrivateOrLocalUrl(url: string): Promise<boolean> {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return true;
  }

  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    return true;
  }

  if (isIP(hostname)) {
    return isPrivateIPv4(hostname) || isPrivateIPv6(hostname);
  }

  try {
    const { address } = await dns.lookup(hostname);
    return isPrivateIPv4(address) || isPrivateIPv6(address);
  } catch {
    return true;
  }
}
