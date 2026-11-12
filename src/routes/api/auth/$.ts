import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { auth } from "@/lib/auth/server.server";
import { getRequest } from "@tanstack/react-start/server";

export const authHandler = createServerFn({ method: "GET" })
  .validator(z.void())
  .handler(async () => {
    const request = getRequest();
    return auth.handler(request);
  });

export const authHandlerPost = createServerFn({ method: "POST" })
  .validator(z.void())
  .handler(async () => {
    const request = getRequest();
    return auth.handler(request);
  });