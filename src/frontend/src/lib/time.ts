export function timeAgo(timestamp: bigint | number | string): string {
  const now = Date.now();
  let ts: number;

  if (typeof timestamp === "bigint") {
    // Assume nanoseconds from IC
    ts = Number(timestamp / BigInt(1_000_000));
  } else if (typeof timestamp === "string") {
    ts = Number.parseInt(timestamp);
  } else {
    ts = timestamp;
  }

  const diff = Math.floor((now - ts) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
