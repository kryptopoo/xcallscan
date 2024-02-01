/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.coinmarketcap.com'
            },
            {
                protocol: 'https',
                hostname: '**.coingecko.com'
            }
        ]
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true
    },
    env: {
        TESTNET_APP_URL: 'https://testnet.xcallscan.xyz',
        MAINNET_APP_URL: 'https://xcallscan.xyz',
    }
}

module.exports = nextConfig
