"use client";

import { QueryClient } from "@tanstack/query-core";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import React, { useState } from "react";
import { trpc } from "../lib/trpc";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes stale-while-revalidate
            cacheTime: 30 * 60 * 1000, // 30 minutes in-memory caching
            refetchOnWindowFocus: false,
            refetchOnMount: true,
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          headers() {
            const headersMap: Record<string, string> = {};
            if (typeof window !== "undefined") {

              // Only send preview header if the actual role is MASTER_ADMIN
              const actualRole = localStorage.getItem("panelva_actual_role") || localStorage.getItem("panelva_role");
              const previewRole = localStorage.getItem("admin-preview-role");
              if (previewRole && previewRole !== "ACTUAL" && actualRole === "MASTER_ADMIN") {
                headersMap["x-preview-role"] = previewRole;
              }
            }
            return headersMap;
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
