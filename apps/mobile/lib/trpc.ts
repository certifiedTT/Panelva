import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@panelva/api";

export const trpc = createTRPCReact<AppRouter>();
