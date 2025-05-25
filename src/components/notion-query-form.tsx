
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
import { Loader2, Terminal, ClipboardCopy } from 'lucide-react'; 
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast"; 

const QueryResults: FC<{ results: any }> = ({ results }) => {
  if (!results) return null;

  return (
    <Card className="mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          Query Results
        </CardTitle>
        <CardDescription>Results from the Notion API query.</CardDescription>
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
  const [constructedUrl, setConstructedUrl] = useState<string>("");
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      databaseId: "",
      apiKey: "", // Form field name remains apiKey
      queryParamsJson: "",
    },
    mode: "onChange", 
  });

  const databaseId = form.watch("databaseId");
  const apiKey = form.watch("apiKey"); // This is the value from the form field named 'apiKey'
  const queryParamsJson = form.watch("queryParamsJson");

  useEffect(() => {
    if (databaseId && apiKey) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      // Changed path to /api/ndb/
      let url = `${baseUrl}/api/ndb/${encodeURIComponent(databaseId)}?sak=${encodeURIComponent(apiKey)}`; 
      
      if (queryParamsJson && queryParamsJson.trim() !== "") {
        try {
          JSON.parse(queryParamsJson); 
          if (!form.formState.errors.queryParamsJson) {
             url += `&filter=${encodeURIComponent(queryParamsJson)}`;
          }
        } catch (e) {
          // Invalid JSON, form validation will show an error
        }
      }
      setConstructedUrl(url);
    } else {
      setConstructedUrl("");
    }
  }, [databaseId, apiKey, queryParamsJson, form.formState.errors.queryParamsJson]);

  const onSubmit = async (values: QueryFormValues) => {
    setQueryResult(null);
    setErrorMessage(null);
    
    // executeNotionQuery still expects an object with an 'apiKey' property
    const result = await executeNotionQuery(values);

    if (result.error) {
      setErrorMessage(result.error + (result.details ? `: ${JSON.stringify(result.details.code)} - ${JSON.stringify(result.details.message)}` : ''));
      setQueryResult(null);
    } else {
      setQueryResult(result);
      setErrorMessage(null);
    }
  };

  const handleCopyUrl = async () => {
    if (!constructedUrl) return;
    try {
      await navigator.clipboard.writeText(constructedUrl);
      toast({
        title: "Copied!",
        description: "API Endpoint URL copied to clipboard.",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy URL to clipboard.",
        variant: "destructive",
        duration: 3000,
      });
      console.error("Failed to copy URL: ", err);
    }
  };

  return (
    <Card className="w-full shadow-xl overflow-hidden rounded-xl">
      <CardHeader className="bg-muted/50 p-6">
        <CardTitle className="text-2xl font-semibold text-primary">Query Configuration</CardTitle>
        <CardDescription>Enter your Notion database details and API key.</CardDescription>
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
              name="apiKey" // Form field name remains apiKey for react-hook-form
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="apiKey" className="text-base font-medium">Notion API Key</FormLabel>
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
            
            {constructedUrl && (
              <div className="p-4 border rounded-md bg-muted/30 space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Your API Endpoint (GET)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary break-all flex-grow">
                    {constructedUrl}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyUrl}
                    className="h-7 w-7 shrink-0 p-1"
                    aria-label="Copy API endpoint URL"
                    disabled={!constructedUrl}
                  >
                    <ClipboardCopy className="h-4 w-4 text-primary" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this URL to directly query your Notion database via a GET request. The API key (as 'sak') and filter are included as query parameters.
                </p>
              </div>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full text-lg py-6 shadow-md hover:shadow-lg transform hover:scale-105">
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Executing...
                </>
              ) : (
                "Execute Query via UI"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      {errorMessage && (
         <CardFooter className="p-6 border-t border-destructive/20 bg-destructive/10">
            <Alert variant="destructive" className="w-full">
              <AlertTitle className="font-semibold">Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        </CardFooter>
      )}

      {queryResult && <QueryResults results={queryResult} />}
    </Card>
  );
};
