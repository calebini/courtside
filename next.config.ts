import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  experimental: {
    // Multipart framing adds overhead beyond the accepted 1 MiB image itself. The domain
    // validator and Storage bucket retain the authoritative 1 MiB object limit.
    serverActions: {bodySizeLimit: '2mb'}
  }
};

export default withNextIntl(nextConfig);
