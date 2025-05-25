
"use server";

type QueryParams = Record<string, any>;

interface ExecuteQueryArgs {
  databaseId: string;
  apiKey: string;
  queryParamsJson?: string;
}

export async function executeNotionQuery(args: ExecuteQueryArgs): Promise<any> {
  const { databaseId, apiKey, queryParamsJson } = args;
  const attemptedAt = new Date().toISOString(); // Timestamp of the query attempt

  if (!databaseId || !apiKey) {
    return { error: "Database ID and API Key are required.", dataFetchedAt: attemptedAt };
  }

  let queryBody: QueryParams = {};
  if (queryParamsJson && queryParamsJson.trim() !== "") {
    try {
      queryBody = JSON.parse(queryParamsJson);
    } catch (e) {
      return { error: "Invalid JSON in query parameters.", dataFetchedAt: attemptedAt };
    }
  }

  const apiUrl = `https://api.notion.com/v1/databases/${databaseId}/query`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: Object.keys(queryBody).length > 0 ? JSON.stringify(queryBody) : "{}",
      cache: 'no-store', // Explicitly prevent caching for this fetch call
    });

    const responseData = await response.json();

    if (!response.ok) {
      return { 
        error: responseData.message || `API Error: ${response.status}`,
        details: responseData,
        dataFetchedAt: attemptedAt
      };
    }

    return {
      ...responseData,
      dataFetchedAt: attemptedAt, // Use the same timestamp for successful fetch
    };
  } catch (error) {
    console.error("Notion API request failed:", error);
    const errorResponse: any = {
      dataFetchedAt: attemptedAt, // Timestamp of the attempt
    };
    if (error instanceof Error) {
      errorResponse.error = `Network or server error: ${error.message}`;
    } else {
      errorResponse.error = "An unknown error occurred while querying Notion API.";
    }
    return errorResponse;
  }
}
