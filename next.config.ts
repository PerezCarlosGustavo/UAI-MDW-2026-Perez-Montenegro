import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El build falla si hay errores de tipos o de lint. Es a propósito:
  // preferimos enterarnos en el Pull Request y no en producción.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  // El login se mudó de /signin a /ingresar: los links viejos siguen andando.
  async redirects() {
    return [{ source: "/signin", destination: "/ingresar", permanent: false }];
  },
};

export default nextConfig;
