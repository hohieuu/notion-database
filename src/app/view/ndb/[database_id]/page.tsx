
import type { NextPage, Metadata } from 'next';
import { executeNotionQuery } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ViewNotionDatabasePageProps {
  params: { database_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

// generateMetadata function to dynamically set page title and meta tags
export async function generateMetadata({ params, searchParams }: ViewNotionDatabasePageProps): Promise<Metadata> {
  const databaseId = params.database_id;
  const apiKey = searchParams?.sak as string | undefined;
  const filterJson = searchParams?.filter as string | undefined;

  let pageTitle = `Notion DB: ${databaseId}`;

  if (databaseId && apiKey) {
    // We can optionally fetch minimal data or check error state to refine title
    // For now, we'll keep it simple. If there's an error, the component will display it.
    // The title can reflect a potential error state if we re-run a lightweight check or
    // if executeNotionQuery was structured to return a preliminary status quickly.
    // However, for this fix, we primarily focus on removing the hydration error.
    // The actual query result for content is handled in the page component.
  } else if (!databaseId || !apiKey) {
    pageTitle = `Error Querying Database`;
  }


  return {
    title: pageTitle,
    robots: {
      index: false,
      follow: false,
    },
  };
}


const ViewNotionDatabasePage: NextPage<ViewNotionDatabasePageProps> = async ({ params, searchParams }) => {
  const databaseId = params.database_id;
  const apiKey = searchParams?.sak as string | undefined;
  const filterJson = searchParams?.filter as string | undefined;

  if (!databaseId) {
    return (
      <div className="min-h-screen bg-white font-sans p-8 flex items-center justify-center">
        <Alert variant="destructive" className="w-full max-w-xl">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Database ID is missing in the path.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-white font-sans p-8 flex items-center justify-center">
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
  let cardTitleText = `Notion DB: ${databaseId}`; // Title for the card

  if (result.error) {
    cardTitleText = `Error Querying: ${databaseId}`;
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
    <div className="min-h-screen bg-white font-sans p-4 md:p-8"> {/* Applied bg-white and font-sans here */}
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">{cardTitleText}</CardTitle>
          <CardDescription>
            {result.error ? "Details of the error encountered." : "Raw JSON response from the Notion API query."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewNotionDatabasePage;

// Force dynamic rendering and prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
