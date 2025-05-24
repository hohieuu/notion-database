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
import { Loader2, Terminal, ExternalLink } from 'lucide-react';

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

import { ScrollArea } from "@/components/ui/scroll-area";

export const NotionQueryForm: FC = () => {
  const [constructedUrl, setConstructedUrl] = useState<string>("");
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(queryFormSchema),
    defaultValues: {
      databaseId: "",
      apiKey: "",
      queryParamsJson: "",
    },
  });

  const databaseId = form.watch("databaseId");

  useEffect(() => {
    if (databaseId) {
      setConstructedUrl(`https://api.notion.com/v1/databases/${databaseId}/query`);
    } else {
      setConstructedUrl("");
    }
  }, [databaseId]);

  const onSubmit = async (values: QueryFormValues) => {
    setQueryResult(null);
    setErrorMessage(null);
    
    const result = await executeNotionQuery(values);

    if (result.error) {
      setErrorMessage(result.error + (result.details ? `: ${JSON.stringify(result.details.code)} - ${JSON.stringify(result.details.message)}` : ''));
      setQueryResult(null);
    } else {
      setQueryResult(result);
      setErrorMessage(null);
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
              name="apiKey"
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
                  <FormLabel htmlFor="queryParamsJson" className="text-base font-medium">Optional Query Parameters (JSON)</FormLabel>
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
              <div className="p-4 border rounded-md bg-muted/30">
                <Label className="text-sm font-medium text-muted-foreground">API Endpoint URL (POST)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <a 
                    href={constructedUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-primary hover:underline break-all"
                    aria-label="Open API endpoint URL in new tab"
                  >
                    {constructedUrl}
                  </a>
                  <ExternalLink className="h-4 w-4 text-primary shrink-0"/>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Note: Query parameters are sent in the request body, not as URL parameters.
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
                "Execute Query"
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
