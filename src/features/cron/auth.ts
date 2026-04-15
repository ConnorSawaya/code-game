import { RouteError } from "@/features/api/route-utils";
import { getServerEnv } from "@/lib/env";

export function assertCronAuthorized(request: Request) {
  const env = getServerEnv();

  if (!env.CRON_SECRET) {
    if (process.env.NODE_ENV === "production") {
      throw new RouteError("CRON_SECRET is missing.", 500);
    }

    return;
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    throw new RouteError("Unauthorized cron request.", 401);
  }
}
