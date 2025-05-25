
"use client";

import type { FC } from 'react';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { executeNotionQuery } from '@/app/actions';
import { queryFormSchema, type QueryFormValues } from '@/schemas/query-form-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Terminal, ClipboardCopy, Eye, Table2 as TableIcon, ExternalLink, HelpCircle } from 'lucide-react'; // Added HelpCircle
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

// Helper function to extract displayable value from Notion property object (copied from table-view page)
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
      return property.created_by?.name || property.created_by?.id || ''; // Show name if available
    case 'last_edited_by':
      return property.last_edited_by?.name || property.last_edited_by?.id || ''; // Show name if available
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
        return <span className="text-xs text-muted-foreground">Rollup ({rollupType})</span>;
      }
      return '';
    case 'formula':
      if (property.formula) {
        const formulaType = property.formula.type;
        const formulaValue = property.formula[formulaType];
        if (formulaValue !== null && formulaValue !== undefined) {
           if (formulaType === 'date' && formulaValue.start) {
                 return new Date(formulaValue.start).toLocaleDateString() + (formulaValue.end ? ' - ' + new Date(formulaValue.end).toLocaleDateString() : '');
            }
          return formulaValue.toString();
        }
        return <span className="text-xs text-muted-foreground">Formula ({formulaType})</span>;
      }
      return '';
    case 'people':
      return property.people?.map((p: any) => <Badge key={p.id} variant="secondary" className="mr-1 mb-1">{p.name || p.id}</Badge>) || '';
    default:
      // Attempt to render basic value if property.type holds a simple value (less common)
      if (property[property.type] !== undefined && typeof property[property.type] !== 'object' && property[property.type] !== null) {
        return String(property[property.type]);
      }
      return <span className="text-xs text-muted-foreground">Unsupported: {property.type}</span>;
  }
};

// Helper to convert Notion colors to hex for status badges (approximate)
const notionColorToHex = (colorName: string): string => {
  const colors: { [key: string]: string } = {
    default: '#E3E2E0', gray: '#9B9A97', brown: '#64473A', orange: '#D9730D',
    yellow: '#DFAB01', green: '#0F7B6C', blue: '#0B6E99', purple: '#6940A5',
    pink: '#AD1A72', red: '#D44C47', gray_background: '#F1F1EF',
    brown_background: '#F3EEEE', orange_background: '#FAEBDD', yellow_background: '#FBF3DB',
    green_background: '#EDF3F3', blue_background: '#E7F0F4', purple_background: '#F0F0F7',
    pink_background: '#F8E7F3', red_background: '#FAECEC',
  };
  return colors[colorName] || colors.default;
};

// Helper to determine if text should be light or dark based on background
const getTextColorForBackground = (hexColor: string): string => {
  if (!hexColor.startsWith('#') || hexColor.length < 7) return '#000000'; // default to black for invalid hex
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};


const QueryResults: FC<{ results: any }> = ({ results }) => {
  if (!results) return null;

  if (results.error) {
    // Error display is handled by the main component's errorMessage state
    return null;
  }

  const dataRows = results.results;

  if (!dataRows || !Array.isArray(dataRows) || dataRows.length === 0) {
    return (
      <Card className="mt-6 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-6 w-6 text-primary" />
            Query Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>No data found for the given query, or the database is empty.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  let columnHeaders: string[] = [];
  if (dataRows.length > 0 && dataRows[0].properties) {
    const allPropertyKeys = new Set<string>();
    dataRows.forEach(row => {
      if (row.properties) {
        Object.keys(row.properties).forEach(key => allPropertyKeys.add(key));
      }
    });
    columnHeaders = Array.from(allPropertyKeys);
  }
  const numRows = dataRows.length;
  const numCols = columnHeaders.length;

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-6 w-6 text-primary" />
          Query Results
        </CardTitle>
        <CardDescription>
          Displaying {numRows} row(s) and {numCols} column(s).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columnHeaders.map((header) => (
                  <TableHead key={header} className="whitespace-nowrap sticky top-0 bg-muted/80 backdrop-blur-sm z-10">{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataRows.map((row) => (
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export const NotionQueryForm: FC = () => {
  const [constructedApiUrl, setConstructedApiUrl] = useState<string>("");
  const [constructedViewUrl, setConstructedViewUrl] = useState<string>("");
  const [constructedTableViewUrl, setConstructedTableViewUrl] = useState<string>("");
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      databaseId: "",
      apiKey: "",
      queryParamsJson: "",
    },
    mode: "onChange", // Validate on change for immediate feedback on JSON
  });

  const databaseId = form.watch("databaseId");
  const apiKey = form.watch("apiKey");
  const queryParamsJson = form.watch("queryParamsJson");

  useEffect(() => {
    const canConstructUrls = databaseId && apiKey && (!form.formState.errors.queryParamsJson || !queryParamsJson || queryParamsJson.trim() === "");

    if (canConstructUrls) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const encodedDbId = encodeURIComponent(databaseId);
      const encodedApiKey = encodeURIComponent(apiKey);

      let queryString = `?sak=${encodedApiKey}`;
      if (queryParamsJson && queryParamsJson.trim() !== "" && !form.formState.errors.queryParamsJson) {
         try {
          JSON.parse(queryParamsJson);
          queryString += `&filter=${encodeURIComponent(queryParamsJson)}`;
        } catch (e) {
          // Invalid JSON, don't append filter. Error message will be shown by form validation.
        }
      }

      setConstructedApiUrl(`${baseUrl}/api/ndb/${encodedDbId}${queryString}`);
      setConstructedViewUrl(`${baseUrl}/view/ndb/${encodedDbId}${queryString}`);
      setConstructedTableViewUrl(`${baseUrl}/table-view/ndb/${encodedDbId}${queryString}`);
    } else {
      setConstructedApiUrl("");
      setConstructedViewUrl("");
      setConstructedTableViewUrl("");
    }
  }, [databaseId, apiKey, queryParamsJson, form.formState.errors.queryParamsJson]);

  const onSubmit = async (values: QueryFormValues) => {
    setQueryResult(null);
    setErrorMessage(null);

    const result = await executeNotionQuery(values);

    if (result.error) {
      let errorMsg = result.error;
      if (result.details && result.details.message) {
        errorMsg += `: ${result.details.message}`;
         if(result.details.code) errorMsg += ` (Code: ${result.details.code})`;
      } else if (result.details && typeof result.details === 'string') {
        errorMsg += `: ${result.details}`;
      } else if (result.details) {
        errorMsg += `: ${JSON.stringify(result.details)}`;
      }
      setErrorMessage(errorMsg);
      setQueryResult(null);
    } else {
      setQueryResult(result);
      setErrorMessage(null);
    }
  };

  const handleCopyUrl = async (urlToCopy: string, linkName: string) => {
    if (!urlToCopy) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      toast({
        title: "Copied!",
        description: `${linkName} URL copied to clipboard.`,
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: `Could not copy ${linkName} URL.`,
        variant: "destructive",
        duration: 3000,
      });
      console.error(`Failed to copy ${linkName} URL: `, err);
    }
  };

  const loadExampleData = () => {
    form.setValue("databaseId", "1fe8a3aa876380149f4cdd56781383a7", { shouldValidate: true });
    form.setValue("apiKey", "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", { shouldValidate: true });
    form.setValue("queryParamsJson", "{}", { shouldValidate: true });
    toast({
      title: "Example Data Loaded",
      description: "Form fields have been populated with example values.",
      duration: 3000,
    });
  };

  return (
    <Card className="w-full shadow-xl overflow-hidden rounded-xl">
      <CardHeader className="bg-muted/50 p-6">
        <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold text-primary">Query Configuration</CardTitle>
            <Button variant="outline" size="sm" onClick={loadExampleData} className="flex items-center gap-1.5">
                <HelpCircle size={16} />
                Load Example Data
            </Button>
        </div>
        <CardDescription>Enter your Notion database details and API key. Then, execute the query or use the generated links.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="databaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="databaseId" className="text-base font-medium">Notion Database ID</FormLabel>
                  <FormControl>
                    <Input id="databaseId" placeholder="e.g., a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6" {...field} className="text-base"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="apiKey" className="text-base font-medium">Notion API Key (Integration Token)</FormLabel>
                  <FormControl>
                    <Input id="apiKey" type="password" placeholder="secret_XXXXXXXXXXXX" {...field} className="text-base"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="queryParamsJson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="queryParamsJson" className="text-base font-medium">Optional Query Filter (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="queryParamsJson"
                      placeholder='{ "filter": { "property": "Status", "select": { "equals": "Done" } } }'
                      {...field}
                      className="min-h-[120px] font-mono text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              {constructedApiUrl && (
                <div className="p-4 border rounded-md bg-muted/30 space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Terminal className="h-4 w-4" /> Your API Endpoint (GET)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary break-all flex-grow">
                      {constructedApiUrl}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyUrl(constructedApiUrl, "API Endpoint")}
                      className="h-7 w-7 shrink-0 p-1"
                      aria-label="Copy API endpoint URL"
                      disabled={!constructedApiUrl}
                    >
                      <ClipboardCopy className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this URL to directly query your Notion database. The API key (as 'sak') and filter are included as query parameters.
                  </p>
                </div>
              )}

              {constructedViewUrl && (
                <div className="p-4 border rounded-md bg-muted/30 space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                     <Eye className="h-4 w-4" /> View Raw JSON Data (UI)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Link href={constructedViewUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary break-all flex-grow hover:underline inline-flex items-center gap-1">
                      {constructedViewUrl} <ExternalLink size={12}/>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyUrl(constructedViewUrl, "Raw JSON View")}
                      className="h-7 w-7 shrink-0 p-1"
                      aria-label="Copy Raw JSON view URL"
                      disabled={!constructedViewUrl}
                    >
                      <ClipboardCopy className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                   <p className="text-xs text-muted-foreground">
                    Open this link in a new tab to view the raw JSON response on a simple page.
                  </p>
                </div>
              )}

              {constructedTableViewUrl && (
                <div className="p-4 border rounded-md bg-muted/30 space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <TableIcon className="h-4 w-4" /> View Data as Table (UI)
                  </Label>
                  <div className="flex items-center gap-2">
                     <Link href={constructedTableViewUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary break-all flex-grow hover:underline inline-flex items-center gap-1">
                       {constructedTableViewUrl} <ExternalLink size={12}/>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyUrl(constructedTableViewUrl, "Table View")}
                      className="h-7 w-7 shrink-0 p-1"
                      aria-label="Copy Table view URL"
                      disabled={!constructedTableViewUrl}
                    >
                      <ClipboardCopy className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Open this link in a new tab to view the data in a structured table format.
                  </p>
                </div>
              )}
            </div>


            <Button type="submit" disabled={form.formState.isSubmitting || !(databaseId && apiKey && !form.formState.errors.databaseId && !form.formState.errors.apiKey && !form.formState.errors.queryParamsJson)} className="w-full text-lg py-6 shadow-md hover:shadow-lg transform transition-colors duration-200 hover:scale-[1.02] active:scale-[0.98]">
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Executing Query...
                </>
              ) : (
                "Execute Query & View Results Below"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      {errorMessage && (
         <CardFooter className="p-6 border-t border-destructive/20 bg-destructive/10">
            <Alert variant="destructive" className="w-full">
              <AlertTitle className="font-semibold">Error Executing Query</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        </CardFooter>
      )}

      {queryResult && !errorMessage && <QueryResults results={queryResult} />}
    </Card>
  );
};


    