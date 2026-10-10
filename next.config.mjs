const legacyRedirects = [
  ['index.html', '/'],
  ['courses.html', '/courses'],
  ['about-us.html', '/about'],
  ['contact.html', '/contact'],
  ['privacy-policy.html', '/privacy'],
  ['terms-conditions.html', '/terms'],
  ['hazmat-awareness.html', '/hazmat-awareness'],
  ['hazmat-course.html', '/hazmat-course'],
  ['login.html', '/login'],
  ['register.html', '/register'],
  ['application-status.html', '/application-status'],
  ['auth-callback.html', '/auth-callback'],
  ['set-password.html', '/set-password'],
  ['dashboard.html', '/dashboard']
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return legacyRedirects.map(([source, destination]) => ({
      source: `/${source}`,
      destination,
      permanent: true
    }));
  }
};

export default nextConfig;
