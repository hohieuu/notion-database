
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { executeNotionQuery } from '@/app/actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { database_id: string } }
) {
  const databaseId = params.database_id;
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('api_key');
  const filterJson = searchParams.get('filter');

  if (!databaseId) {
    return NextResponse.json({ error: "Database ID is missing in path." }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "API Key (api_key) is missing in query parameters." }, { status: 400 });
  }

  const result = await executeNotionQuery({
    databaseId: databaseId,
    apiKey: apiKey,
    queryParamsJson: filterJson || undefined, // Pass undefined if filterJson is null or empty
  });

  if (result.error) {
    let statusCode = 500; // Default for unhandled/network errors from executeNotionQuery

    // If Notion API returned an error, result.details should contain the original status
    if (result.details && typeof result.details.status === 'number') {
      statusCode = result.details.status;
    } else if (typeof result.error === 'string' && result.error.toLowerCase().includes("invalid json")) {
      // Handle errors generated within executeNotionQuery before calling Notion
      statusCode = 400;
    }
    // Add more specific checks if needed for other errors from executeNotionQuery

    return NextResponse.json({ error: result.error, details: result.details }, { status: statusCode });
  }

  return NextResponse.json(result, { status: 200 });
}
