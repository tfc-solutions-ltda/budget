/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
        unoptimized: false,
        domains: ['lh3.googleusercontent.com', 'euxmpkmlwsoflpohvvwx.supabase.co'],
    },
};

module.exports = nextConfig; 