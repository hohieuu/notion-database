"use server";

type QueryParams = Record<string, any>;

interface ExecuteQueryArgs {
  databaseId: string;
  apiKey: string;
  queryParamsJson?: string;
}

export async function executeNotionQuery(args: ExecuteQueryArgs): Promise<any> {
  const { databaseId, apiKey, queryParamsJson } = args;

  if (!databaseId || !apiKey) {
    return { error: "Database ID and API Key are required." };
  }

  let queryBody: QueryParams = {};
  if (queryParamsJson && queryParamsJson.trim() !== "") {
    try {
      queryBody = JSON.parse(queryParamsJson);
    } catch (e) {
      return { error: "Invalid JSON in query parameters." };
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
    });

    const responseData = await response.json();

    if (!response.ok) {
      return { 
        error: responseData.message || `API Error: ${response.status}`,
        details: responseData 
      };
    }

    return responseData;
  } catch (error) {
    console.error("Notion API request failed:", error);
    if (error instanceof Error) {
      return { error: `Network or server error: ${error.message}` };
    }
    return { error: "An unknown error occurred while querying Notion API." };
  }
}
