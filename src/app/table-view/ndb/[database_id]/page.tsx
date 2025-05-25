
import type { NextPage, Metadata } from 'next';
import { executeNotionQuery } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from 'lucide-react';

interface TableViewNotionDatabasePageProps {
  params: { database_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: TableViewNotionDatabasePageProps): Promise<Metadata> {
  const databaseId = params.database_id;
  return {
    title: `Table View: Notion DB ${databaseId}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

// Helper function to extract displayable value from Notion property object
const getNotionPropertyValue = (property: any, propertyName?: string): React.ReactNode => {
  if (!property) return '';

  const renderLink = (url: string, text?: string) => (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
      {text || url}
      <ExternalLink size={14} />
    </a>
  );

  switch (property.type) {
    case 'title':
      return property.title?.[0]?.plain_text || '';
    case 'rich_text':
      return property.rich_text?.map((rt: any) => rt.plain_text).join('') || '';
    case 'number':
      return property.number?.toLocaleString() || '';
    case 'select':
      return property.select ? <Badge variant="outline">{property.select.name}</Badge> : '';
    case 'multi_select':
      return property.multi_select?.length > 0 
        ? property.multi_select.map((s: any) => <Badge key={s.id || s.name} variant="outline" className="mr-1 mb-1">{s.name}</Badge>) 
        : '';
    case 'status':
      return property.status ? <Badge style={{ backgroundColor: notionColorToHex(property.status.color), color:getTextColorForBackground(notionColorToHex(property.status.color))}}>{property.status.name}</Badge> : '';
    case 'date':
      if (!property.date?.start) return '';
      let dateStr = new Date(property.date.start).toLocaleDateString();
      if (property.date.end) {
        dateStr += ` - ${new Date(property.date.end).toLocaleDateString()}`;
      }
      return dateStr;
    case 'checkbox':
      return property.checkbox ? '✔️ Yes' : '❌ No';
    case 'url':
      return property.url ? renderLink(property.url) : '';
    case 'email':
      return property.email ? <a href={`mailto:${property.email}`} className="text-primary hover:underline">{property.email}</a> : '';
    case 'phone_number':
      return property.phone_number ? <a href={`tel:${property.phone_number}`} className="text-primary hover:underline">{property.phone_number}</a> : '';
    case 'files':
      return property.files?.map((f: any, index: number) => (
        <div key={index}>
          {f.type === 'external' && f.external?.url ? renderLink(f.external.url, f.name || f.external.url) : f.name || 'File'}
        </div>
      )) || 'No files';
    case 'created_time':
      return property.created_time ? new Date(property.created_time).toLocaleString() : '';
    case 'last_edited_time':
      return property.last_edited_time ? new Date(property.last_edited_time).toLocaleString() : '';
    case 'created_by':
      return property.created_by?.id || ''; // Simplified: show ID
    case 'last_edited_by':
      return property.last_edited_by?.id || ''; // Simplified: show ID
    case 'relation':
       if (property.relation?.length > 0) {
        return <Badge variant="secondary">{`${property.relation.length} relation(s)`}</Badge>;
      }
      return 'No relations';
    case 'rollup':
      if (property.rollup) {
        const rollupType = property.rollup.type;
        const rollupValue = property.rollup[rollupType];
        if (rollupValue !== null && rollupValue !== undefined) {
          if (rollupType === 'array' && Array.isArray(rollupValue)) {
             return rollupValue.map((item: any, index: number) => <div key={index}>{getNotionPropertyValue(item)}</div>);
          }
          if (rollupType === 'date' && rollupValue.start) {
             return new Date(rollupValue.start).toLocaleDateString() + (rollupValue.end ? ' - ' + new Date(rollupValue.end).toLocaleDateString() : '');
          }
          return rollupValue.toString();
        }
        return `Rollup (${rollupType})`;
      }
      return '';
    case 'formula':
      if (property.formula) {
        const formulaType = property.formula.type;
        const formulaValue = property.formula[formulaType];
        if (formulaValue !== null && formulaValue !== undefined) {
           if (formulaType === 'date' && formulaValue.start) { // Handle date in formula
                 return new Date(formulaValue.start).toLocaleDateString() + (formulaValue.end ? ' - ' + new Date(formulaValue.end).toLocaleDateString() : '');
            }
          return formulaValue.toString();
        }
        return `Formula (${formulaType})`;
      }
      return '';
    case 'people':
      return property.people?.map((p: any) => <Badge key={p.id} variant="secondary" className="mr-1 mb-1">{p.name || p.id}</Badge>) || '';
    default:
      if (property[property.type] !== undefined && typeof property[property.type] !== 'object' && property[property.type] !== null) {
        return String(property[property.type]);
      }
      return <span className="text-xs text-muted-foreground">Unsupported: {property.type}</span>;
  }
};

// Helper to convert Notion colors to hex for status badges (approximate)
const notionColorToHex = (colorName: string): string => {
  const colors: { [key: string]: string } = {
    default: '#E3E2E0', // Light gray
    gray: '#9B9A97',
    brown: '#64473A',
    orange: '#D9730D',
    yellow: '#DFAB01',
    green: '#0F7B6C',
    blue: '#0B6E99',
    purple: '#6940A5',
    pink: '#AD1A72',
    red: '#D44C47',
    gray_background: '#F1F1EF',
    brown_background: '#F3EEEE',
    orange_background: '#FAEBDD',
    yellow_background: '#FBF3DB',
    green_background: '#EDF3F3',
    blue_background: '#E7F0F4',
    purple_background: '#F0F0F7',
    pink_background: '#F8E7F3',
    red_background: '#FAECEC',
  };
  return colors[colorName] || colors.default;
};

// Helper to determine if text should be light or dark based on background
const getTextColorForBackground = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF'; // Return black for light backgrounds, white for dark
};


const TableViewNotionDatabasePage: NextPage<TableViewNotionDatabasePageProps> = async ({ params, searchParams }) => {
  const databaseId = params.database_id;
  const apiKey = searchParams?.sak as string | undefined;
  const filterJson = searchParams?.filter as string | undefined;

  if (!databaseId) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Alert variant="destructive" className="w-full max-w-xl">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Database ID is missing in the path.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
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
  let columnHeaders: string[] = [];
  let rows: any[] = [];
  let numRows = 0;
  let numCols = 0;
  
  let formattedTimestamp = 'N/A';
  if (result.dataFetchedAt) {
    try {
      const date = new Date(result.dataFetchedAt);
      // Format the timestamp to UTC and append "UTC"
      formattedTimestamp = date.toLocaleString(undefined, { // Use 'undefined' for user's locale conventions for date/month order
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC', // Specify UTC
        hour12: true // Use 12-hour format (e.g., AM/PM) - adjust as needed
      }) + ' UTC';
    } catch (e) {
      console.error("Error formatting timestamp in TableViewNotionDatabasePage:", e);
      formattedTimestamp = 'Invalid Date';
    }
  }

  if (result.error) {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Query Error</AlertTitle>
        <AlertDescription>
          <p>{result.error}</p>
          {result.details && <pre className="mt-2 text-xs whitespace-pre-wrap break-all">{JSON.stringify(result.details, null, 2)}</pre>}
        </AlertDescription>
      </Alert>
    );
  } else if (!result.results || !Array.isArray(result.results) || result.results.length === 0) {
    content = (
      <Alert>
        <AlertTitle>No Data</AlertTitle>
        <AlertDescription>No data found in this database for the given query, or the database is empty.</AlertDescription>
      </Alert>
    );
  } else {
    rows = result.results;
    if (rows.length > 0 && rows[0].properties) {
      // Collect all unique property keys from all rows to handle variations
      const allPropertyKeys = new Set<string>();
      rows.forEach(row => {
        if (row.properties) {
          Object.keys(row.properties).forEach(key => allPropertyKeys.add(key));
        }
      });
      columnHeaders = Array.from(allPropertyKeys);
    }
    numRows = rows.length;
    numCols = columnHeaders.length;

    content = (
      <>
        <p className="text-sm text-muted-foreground mb-4">
          Displaying {numRows} row(s) and {numCols} column(s).
        </p>
        <div className="w-full overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columnHeaders.map((header) => (
                  <TableHead key={header} className="whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur-sm z-10">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {columnHeaders.map((header) => (
                    <TableCell key={`${row.id}-${header}`} className="align-top">
                      {getNotionPropertyValue(row.properties?.[header], header)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <Card className="w-full max-w-7xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Notion Database Table View</CardTitle>
          <CardDescription>
            Viewing data for Database ID: <code className="bg-muted px-1 py-0.5 rounded text-sm">{databaseId}</code>.
            {filterJson && <span className="block mt-1 text-xs">Applied filter: <code className="bg-muted px-1 py-0.5 rounded">{filterJson}</code></span>}
          </CardDescription>
          {formattedTimestamp !== 'N/A' && formattedTimestamp !== 'Invalid Date' && (
            <p className="text-xs text-muted-foreground pt-2">
              Data last refreshed: {formattedTimestamp}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    </div>
  );
};

export default TableViewNotionDatabasePage;

// Force dynamic rendering and prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
    

    

    