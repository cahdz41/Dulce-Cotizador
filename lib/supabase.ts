// Re-export browser client for backwards compatibility with existing components
export { createClient as createBrowserClient } from "./supabase/client";

import { createClient } from "./supabase/client";

export const supabase = createClient();

