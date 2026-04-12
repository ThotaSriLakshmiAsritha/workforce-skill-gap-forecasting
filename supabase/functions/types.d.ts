declare module "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare module "npm:@supabase/supabase-js" {
  export * from "@supabase/supabase-js";
}

declare module "npm:@google/generative-ai" {
  export * from "@google/generative-ai";
}

declare namespace Deno {
  const env: {
    get(name: string): string | undefined;
  };

  function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
}
