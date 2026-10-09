export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return response.status(503).json({
      error: 'Authentication is not configured yet.'
    });
  }

  response.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  return response.status(200).json({ url, anonKey });
}
