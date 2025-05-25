
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
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
import { Loader2, Terminal, ClipboardCopy, Eye, Table2, ExternalLink } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

const QueryResults: FC<{ results: any }> = ({ results }) => {
  if (!results) return null;

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          Query Results
        </CardTitle>
        <CardDescription>Results from the Notion API query (executed via UI button).</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-secondary/30">
          <pre className="text-sm whitespace-pre-wrap break-all">
            {JSON.stringify(results, null, 2)}
          </pre>
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
    mode: "onChange",
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
          JSON.parse(queryParamsJson); // Final check for valid JSON before appending
          queryString += `&filter=${encodeURIComponent(queryParamsJson)}`;
        } catch (e) {
          // If JSON is invalid at this stage, do not append filter; form validation will handle error display
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
      setErrorMessage(result.error + (result.details ? `: ${typeof result.details.code === 'string' ? result.details.code : JSON.stringify(result.details.code)} - ${typeof result.details.message === 'string' ? result.details.message : JSON.stringify(result.details.message)}` : ''));
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

  return (
    <Card className="w-full shadow-xl overflow-hidden rounded-xl">
      <CardHeader className="bg-muted/50 p-6">
        <CardTitle className="text-2xl font-semibold text-primary">Query Configuration</CardTitle>
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
                    <Table2 className="h-4 w-4" /> View Data as Table (UI)
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


            <Button type="submit" disabled={form.formState.isSubmitting || !(databaseId && apiKey)} className="w-full text-lg py-6 shadow-md hover:shadow-lg transform transition-colors duration-200 hover:scale-[1.02] active:scale-[0.98]">
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

      {queryResult && <QueryResults results={queryResult} />}
    </Card>
  );
};

