export function parseBrowser(userAgent: string | undefined): string {
  if (!userAgent) return "Unknown";

  const ua = userAgent;

  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    if (/Mobile/i.test(ua)) return "Chrome Mobile";
    return "Chrome";
  }
  if (/Firefox\//i.test(ua)) {
    if (/Mobile/i.test(ua)) return "Firefox Mobile";
    return "Firefox";
  }
  if (/Safari\//i.test(ua) && /Version\//i.test(ua)) {
    if (/Mobile/i.test(ua)) return "Safari Mobile";
    return "Safari";
  }
  if (/MSIE |Trident\//i.test(ua)) return "Internet Explorer";

  return "Unknown";
}
