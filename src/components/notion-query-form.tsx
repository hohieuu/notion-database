
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
import { Loader2, ClipboardCopy, Eye, Table2 as TableIcon, ExternalLink, HelpCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

export const NotionQueryForm: FC = () => {
  const [constructedViewUrl, setConstructedViewUrl] = useState<string>("");
  const [constructedTableViewUrl, setConstructedTableViewUrl] = useState<string>("");
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
          JSON.parse(queryParamsJson); // Ensure it's valid JSON before appending
          queryString += `&filter=${encodeURIComponent(queryParamsJson)}`;
        } catch (e) {
          // Invalid JSON, don't append filter. Error message will be shown by form validation.
        }
      }
      
      setConstructedTableViewUrl(`${baseUrl}/table-view/ndb/${encodedDbId}${queryString}`);
      setConstructedViewUrl(`${baseUrl}/view/ndb/${encodedDbId}${queryString}`);
    } else {
      setConstructedTableViewUrl("");
      setConstructedViewUrl("");
    }
  }, [databaseId, apiKey, queryParamsJson, form.formState.errors.queryParamsJson]);

  const onSubmit = async (values: QueryFormValues) => {
    setErrorMessage(null); 
    // We still execute the query to validate credentials and parameters.
    // The result itself won't be displayed directly on this page anymore.
    const result = await executeNotionQuery(values);

    if (result.error) {
      let errorMsg = result.error;
      if (result.details && result.details.message) {
        errorMsg += `: ${result.details.message}`;
         if(result.details.code) errorMsg += ` (Code: ${result.details.code})`;
      } else if (result.details && typeof result.details === 'string') {
        errorMsg += `: ${result.details}`;
      } else if (result.details) {
        // Attempt to stringify if it's an object, otherwise show it's complex
        try {
            const detailStr = JSON.stringify(result.details);
            if (detailStr !== '{}') { // Avoid showing empty object
                 errorMsg += `: ${detailStr}`;
            }
        } catch (e) {
            errorMsg += ` (Complex error details present)`;
        }
      }
      setErrorMessage(errorMsg);
      toast({
        title: "Validation Failed",
        description: "Please check your inputs and the error message below.",
        variant: "destructive",
        duration: 5000,
      });
    } else {
      // On success, clear any previous error and confirm to user
      setErrorMessage(null);
      toast({
        title: "Validation Successful!",
        description: "Your inputs seem correct. You can now use the generated links.",
        duration: 3000,
      });
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

  const isButtonDisabled = form.formState.isSubmitting || 
                         !databaseId || 
                         !apiKey || 
                         !!form.formState.errors.databaseId || 
                         !!form.formState.errors.apiKey || 
                         !!form.formState.errors.queryParamsJson;


  return (
    <Card className="w-full shadow-xl overflow-hidden rounded-xl">
      <CardHeader className="bg-muted/50 p-6">
        <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-semibold text-primary">Query Configuration</CardTitle>
            <Button variant="secondary" size="sm" onClick={loadExampleData} className="flex items-center gap-1.5">
                <HelpCircle size={16} />
                Load Example Data
            </Button>
        </div>
        <CardDescription>Enter your Notion database details and API key. Validate to generate direct access links.</CardDescription>
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
              {constructedTableViewUrl && (
                <div className="p-4 border rounded-md bg-muted/30 space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <TableIcon className="h-4 w-4" /> Table View
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
              
              {constructedViewUrl && (
                <div className="p-4 border rounded-md bg-muted/30 space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                     <Eye className="h-4 w-4" /> JSON View
                  </Label>
                  <div className="flex items-center gap-2">
                    <Link href={constructedViewUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary break-all flex-grow hover:underline inline-flex items-center gap-1">
                      {constructedViewUrl} <ExternalLink size={12}/>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyUrl(constructedViewUrl, "JSON View")}
                      className="h-7 w-7 shrink-0 p-1"
                      aria-label="Copy JSON view URL"
                      disabled={!constructedViewUrl}
                    >
                      <ClipboardCopy className="h-4 w-4 text-primary" />
                    </Button>
                  </div>
                   <p className="text-xs text-muted-foreground">
                    Open this link to view the raw JSON response on a simple page.
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isButtonDisabled} className="w-full text-lg py-6 shadow-md hover:shadow-lg transform transition-colors duration-200 hover:scale-[1.02] active:scale-[0.98]">
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Validating...
                </>
              ) : (
                "Validate & Generate Links"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      {errorMessage && (
         <CardFooter className="p-6 border-t border-destructive/20 bg-destructive/10">
            <Alert variant="destructive" className="w-full">
              <AlertTitle className="font-semibold">Validation Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
        </CardFooter>
      )}
      {/* QueryResults component removed */}
    </Card>
  );
};

    