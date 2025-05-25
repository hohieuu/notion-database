
import { NotionQueryForm } from '@/components/notion-query-form';
import { Toaster } from "@/components/ui/toaster";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <main className="container mx-auto max-w-2xl w-full">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold text-primary tracking-tight">
            Notion Query Tool
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Easily query your Notion databases with a simple interface.
          </p>
        </header>
        <NotionQueryForm />

        <section aria-labelledby="instructions-heading" className="mt-12 mb-8">
          <h2 id="instructions-heading" className="text-3xl font-semibold text-center mb-6 text-primary/90">
            How to Get Started
          </h2>
          <Accordion type="single" collapsible className="w-full bg-card p-4 sm:p-6 rounded-lg shadow-md border">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg hover:text-primary">1. How to get your Notion Database ID</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2 pt-3">
                <p>Your Notion Database ID is part of the URL when you open your database in Notion.</p>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                  <li>Open the Notion database you want to query in your web browser.</li>
                  <li>Look at the URL in your browser's address bar. It will look something like this:
                    <br />
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm break-all">https://www.notion.so/<strong>your-workspace-name</strong>/<strong>DATABASE_ID</strong>?v=view_id</code>
                  </li>
                  <li>The <strong className="text-primary">DATABASE_ID</strong> is the long string of letters and numbers (usually 32 characters) that appears right after your workspace name and before the question mark (<code className="bg-muted px-1 py-0.5 rounded text-sm">?</code>).</li>
                  <li>For example, if your URL is <code className="bg-muted px-1.5 py-0.5 rounded text-sm break-all">https://www.notion.so/myteam/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6?v=...</code>, then your Database ID is <code className="bg-muted px-1.5 py-0.5 rounded text-sm">a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6</code>.</li>
                  <li>Copy this ID and paste it into the "Notion Database ID" field above.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg hover:text-primary">2. How to get your Notion API Key (Integration Token)</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-3 pt-3">
                <p>To allow this tool to access your Notion data, you need to create an "Integration" in Notion and get an API Key (also called an "Internal Integration Token").</p>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                  <li>
                    Go to your Notion Integrations page: <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">www.notion.so/my-integrations <ExternalLink size={14}/></a>. You might need to log in.
                  </li>
                  <li>Click the <strong className="text-primary">"+ New integration"</strong> button.</li>
                  <li>
                    Fill out the form:
                    <ul className="list-disc list-inside pl-6 mt-1 space-y-0.5">
                      <li><strong>Name:</strong> Give your integration a descriptive name, like "My Notion Query Tool".</li>
                      <li><strong>Associated workspace:</strong> Select the workspace that contains the database you want to query.</li>
                      <li><strong>Capabilities:</strong> For reading data, "Read content" is usually enough. You can adjust permissions as needed. This tool currently only reads data.</li>
                    </ul>
                  </li>
                  <li>Click <strong className="text-primary">"Submit"</strong>.</li>
                  <li>On the next page, you'll see a section called <strong className="text-primary">"Secrets"</strong>. Your API Key is the <strong className="text-primary">"Internal Integration Token"</strong>. It will look like <code className="bg-muted px-1.5 py-0.5 rounded text-sm">secret_XXXXXXXXXXXXXXXXXXXX</code>.</li>
                  <li>Click "Show" and then "Copy" to copy this token. <strong className="text-destructive">Keep this token secure, like a password!</strong></li>
                  <li>Paste it into the "Notion API Key" field above.</li>
                  <li>
                    <strong className="text-primary">VERY IMPORTANT:</strong> Now, you must connect this new integration to the specific database(s) you want to query.
                    <ul className="list-disc list-inside pl-6 mt-1 space-y-0.5">
                      <li>Go to the Notion database page you want to query.</li>
                      <li>Click the three dots (<strong className="text-primary">...</strong>) menu at the top right of the database page.</li>
                      <li>Scroll down and click on <strong className="text-primary">"+ Add connections"</strong> (or it might be under "Connections").</li>
                      <li>Find the integration you just created (e.g., "My Notion Query Tool") in the list and select it.</li>
                      <li>Click <strong className="text-primary">"Confirm"</strong>.</li>
                    </ul>
                  </li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-lg hover:text-primary">3. How to write a basic Query Filter (Optional)</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-2 pt-3">
                <p>The "Optional Query Filter" field allows you to specify which data to retrieve from your Notion database. If you leave it empty, the tool will try to fetch all data (up to Notion's API limits).</p>
                <p>Filters are written in <strong className="text-primary">JSON format</strong>. Here's a simple example:</p>
                <p>Let's say you have a "Status" property in your database (which is a Select type), and you only want items where the Status is "Done". Your filter would look like this:</p>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                  <code>
{`{
  "filter": {
    "property": "Status",
    "select": {
      "equals": "Done"
    }
  }
}`}
                  </code>
                </pre>
                <ul className="list-disc list-inside pl-4 space-y-1">
                  <li><code className="bg-muted px-1 py-0.5 rounded text-sm">"filter"</code>: This is the main object for all filter conditions.</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded text-sm">"property": "Status"</code>: Tells Notion you want to filter based on a property named "Status". Replace "Status" with your actual property name.</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded text-sm">"select"</code>: This indicates the type of the "Status" property. If it were a Text property, you might use <code className="bg-muted px-1 py-0.5 rounded text-sm">"rich_text"</code>, or for a Number property, <code className="bg-muted px-1 py-0.5 rounded text-sm">"number"</code>.</li>
                  <li><code className="bg-muted px-1 py-0.5 rounded text-sm">"equals": "Done"</code>: This is the condition for the "Status" property. It means you want items where the "Status" is exactly "Done".</li>
                </ul>
                <p>
                  For more complex filters (e.g., filtering by dates, numbers, multiple conditions), refer to the official Notion API documentation:
                  <br />
                  <a href="https://developers.notion.com/reference/post-database-query-filter" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    Notion API Filter Documentation <ExternalLink size={14}/>
                  </a>
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </main>
      <Toaster />
      <footer className="py-8 text-center text-muted-foreground text-sm">
        Powered by Next.js and Notion API
      </footer>
    </div>
  );
}

