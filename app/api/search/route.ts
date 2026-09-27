import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/modules/auth/session';
import { globalSearch } from '@/modules/search/service';

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session?.accountId) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get('q') ?? '';
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await globalSearch(query, session.accountId);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
