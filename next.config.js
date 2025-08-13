/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for WebRTC to work properly
  // output: 'export', 
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    unoptimized: true, // Required for static export if needed later
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        // Don't disable TLS as WebRTC needs secure connections
        // tls: false,
      };

      // Add support for WebRTC and media devices
      config.resolve.alias = {
        ...config.resolve.alias,
      };

      // Ensure proper handling of WebRTC modules
      config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });
    }
    return config;
  },
  // Enable experimental features that might help with WebRTC
  experimental: {
    esmExternals: 'loose',
  },
}

module.exports = nextConfig
