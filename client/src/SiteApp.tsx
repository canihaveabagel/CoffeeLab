"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, httpBatchLink } from "@trpc/client";
import { useEffect, useState } from "react";
import superjson from "superjson";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import App from "./App";
import { getLoginUrl } from "./const";
import { trpc } from "./lib/trpc";

function redirectToLoginIfUnauthorized(error: unknown) {
  if (!(error instanceof TRPCClientError)) return;
  if (error.message !== UNAUTHED_ERR_MSG) return;
  window.location.href = getLoginUrl();
}

export default function SiteApp() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [queryClient] = useState(() => {
    const client = new QueryClient();
    client.getQueryCache().subscribe(event => {
      if (event.type === "updated" && event.action.type === "error") {
        redirectToLoginIfUnauthorized(event.query.state.error);
      }
    });
    client.getMutationCache().subscribe(event => {
      if (event.type === "updated" && event.action.type === "error") {
        redirectToLoginIfUnauthorized(event.mutation.state.error);
      }
    });
    return client;
  });
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch(input, init) {
            return globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: "include",
            });
          },
        }),
      ],
    }),
  );

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center paper-bg">
        <p className="font-mono text-sm text-[var(--color-ink-muted)]">
          Loading workspace…
        </p>
      </div>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
