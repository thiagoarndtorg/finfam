let userConfig = {}
try {
  userConfig = (await import('./v0-user-next.config')).default || {}
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
}

mergeConfig(nextConfig, userConfig)

function mergeConfig(target, source) {
  if (!source) return

  for (const key in source) {
    if (
      typeof target[key] === 'object' &&
      typeof source[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      target[key] = { ...target[key], ...source[key] }
    } else {
      target[key] = source[key]
    }
  }
}

console.log("NEXT FINAL CONFIG:", JSON.stringify(nextConfig, null, 2))

export default nextConfig