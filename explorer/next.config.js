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
        BASE_API_URLL: 'http://localhost:4000/api',
        TESTNET_APP_URL: 'http://localhost:3000',
        MAINNET_APP_URL: 'http://localhost:3100',
        NETWORK: 'Testnet'
    }
}

module.exports = nextConfig
