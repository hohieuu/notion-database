import { z } from "zod";

export const queryFormSchema = z.object({
  databaseId: z.string().min(1, "Database ID is required."),
  apiKey: z.string().min(1, "API Key is required."),
  queryParamsJson: z.string().optional().refine(
    (val) => {
      if (!val || val.trim() === "") return true; // Optional, so empty is fine
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: "Query parameters must be valid JSON or empty." }
  ),
});

export type QueryFormValues = z.infer<typeof queryFormSchema>;
