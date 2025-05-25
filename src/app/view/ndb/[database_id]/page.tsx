
import type { NextPage } from 'next';
import { executeNotionQuery } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// ScrollArea import removed as it's no longer used

interface ViewNotionDatabasePageProps {
  params: { database_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const ViewNotionDatabasePage: NextPage<ViewNotionDatabasePageProps> = async ({ params, searchParams }) => {
  const databaseId = params.database_id;
  const apiKey = searchParams?.sak as string | undefined;
  const filterJson = searchParams?.filter as string | undefined;

  if (!databaseId) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <Alert variant="destructive" className="w-full max-w-xl">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Database ID is missing in the path.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <Alert variant="destructive" className="w-full max-w-xl">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>API Key (sak) is missing in query parameters.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const result = await executeNotionQuery({
    databaseId: databaseId,
    apiKey: apiKey,
    queryParamsJson: filterJson || undefined,
  });

  let content;
  let pageTitle = `Notion DB: ${databaseId}`;

  if (result.error) {
    pageTitle = `Error Querying: ${databaseId}`;
    content = (
      <Alert variant="destructive">
        <AlertTitle>Query Error</AlertTitle>
        <AlertDescription>
          <p>{result.error}</p>
          {result.details && <pre className="mt-2 text-xs whitespace-pre-wrap break-all">{JSON.stringify(result.details, null, 2)}</pre>}
        </AlertDescription>
      </Alert>
    );
  } else {
    content = (
      <div className="w-full rounded-md border bg-secondary/30 p-4 overflow-x-auto">
        <pre className="text-sm whitespace-pre-wrap break-all">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" /> 
      </head>
      <body className="bg-white font-sans">
        <div className="min-h-screen p-4 md:p-8">
          <Card className="w-full max-w-4xl mx-auto shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{pageTitle}</CardTitle>
              <CardDescription>
                {result.error ? "Details of the error encountered." : "Raw JSON response from the Notion API query."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {content}
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
};

export default ViewNotionDatabasePage;

// Force dynamic rendering and prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
