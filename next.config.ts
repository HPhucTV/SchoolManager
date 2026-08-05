import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const apiOrigin = (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").origin;
      } catch {
        return "http://127.0.0.1:8001";
      }
    })();
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: 'camera=(self "https://meet.jit.si"), microphone=(self "https://meet.jit.si"), geolocation=()' },
    ];

    if (isProduction) {
      const contentSecurityPolicy = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://meet.jit.si",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        `connect-src 'self' ${apiOrigin} https://meet.jit.si wss:`,
        "frame-src https://meet.jit.si",
        "media-src 'self' blob: https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ];

      if (apiOrigin.startsWith("https://")) {
        contentSecurityPolicy.push("upgrade-insecure-requests");
      }

      headers.push({
        key: "Content-Security-Policy",
        value: contentSecurityPolicy.join("; "),
      });
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [{ source: "/(.*)", headers }];
  },
};

export default nextConfig;
