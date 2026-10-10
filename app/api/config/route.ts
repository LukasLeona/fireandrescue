import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: 'Authentication is not configured yet.' }, { status: 503 });
  return NextResponse.json({ url, anonKey }, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } });
}
