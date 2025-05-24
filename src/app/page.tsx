import { NotionQueryForm } from '@/components/notion-query-form';
import { Toaster } from "@/components/ui/toaster";

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
      </main>
      <Toaster />
      <footer className="py-8 text-center text-muted-foreground text-sm">
        Powered by Next.js and Notion API
      </footer>
    </div>
  );
}
