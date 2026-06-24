import type { NextConfig } from "next";
import path from "path";

// Dominios autorizados a embeber la app dentro de un iframe (integración Revive).
// 'self' garantiza que proximoresidente.com nunca pierde la capacidad de mostrarse
// a sí misma. Añadir/quitar dominios aquí es el único punto de control.
const FRAME_ANCESTORS = [
  "'self'",
  "https://revivevirtual.com",
  "https://www.revivevirtual.com",
].join(" ");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Solo controla QUIÉN puede embeber la app. No restringe scripts,
          // estilos ni nada más (no hay default-src), por lo que no afecta el
          // funcionamiento normal para usuarios directos.
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${FRAME_ANCESTORS};`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
