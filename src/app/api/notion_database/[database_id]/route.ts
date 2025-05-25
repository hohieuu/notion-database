
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { executeNotionQuery } from '@/app/actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { database_id: string } }
) {
  const databaseId = params.database_id;
  const { searchParams } = new URL(request.url);
  const apiKey = searchParams.get('sak'); // Changed 'api_key' to 'sak'
  const filterJson = searchParams.get('filter');

  if (!databaseId) {
    return NextResponse.json({ error: "Database ID is missing in path." }, { status: 400 });
  }

  if (!apiKey) {
    // Updated error message to reflect 'sak'
    return NextResponse.json({ error: "API Key (sak) is missing in query parameters." }, { status: 400 });
  }

  const result = await executeNotionQuery({
    databaseId: databaseId,
    apiKey: apiKey, // executeNotionQuery still expects an 'apiKey' property in its argument object
    queryParamsJson: filterJson || undefined, 
  });

  if (result.error) {
    let statusCode = 500; 

    if (result.details && typeof result.details.status === 'number') {
      statusCode = result.details.status;
    } else if (typeof result.error === 'string' && result.error.toLowerCase().includes("invalid json")) {
      statusCode = 400;
    }
    
    return NextResponse.json({ error: result.error, details: result.details }, { status: statusCode });
  }

  return NextResponse.json(result, { status: 200 });
}

