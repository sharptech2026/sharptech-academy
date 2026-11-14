import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { auth, authConfigured } from "@/lib/auth/server.server";
import { getRequest } from "@tanstack/react-start/server";

export const authHandler = createServerFn({ method: "GET" })
  .validator(z.void())
  .handler(async () => {
    if (!authConfigured) return new Response("Not Found", { status: 404 });
    const request = getRequest();
    return auth.handler(request);
  });

export const authHandlerPost = createServerFn({ method: "POST" })
  .validator(z.void())
  .handler(async () => {
    if (!authConfigured) return new Response("Not Found", { status: 404 });
    const request = getRequest();
    return auth.handler(request);
  });