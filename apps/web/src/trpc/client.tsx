"use client";

import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@reos/api";

export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();
