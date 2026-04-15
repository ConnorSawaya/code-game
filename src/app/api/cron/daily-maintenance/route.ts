import { jsonError, jsonOk } from "@/lib/http";
import { GET as runExpiredReplays } from "@/app/api/cron/expired-replays/route";
import { GET as runPruneReplayBucket } from "@/app/api/cron/prune-replay-bucket/route";
import { GET as runStaleRooms } from "@/app/api/cron/stale-rooms/route";

export async function GET(request: Request) {
  const jobs = [
    { name: "stale-rooms", handler: runStaleRooms },
    { name: "expired-replays", handler: runExpiredReplays },
    { name: "prune-replay-bucket", handler: runPruneReplayBucket },
  ];

  const results: Array<{ name: string; result: unknown }> = [];

  for (const job of jobs) {
    const response = await job.handler(request.clone());
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return jsonError(`Daily maintenance failed during ${job.name}.`, response.status, body);
    }

    results.push({
      name: job.name,
      result: body,
    });
  }

  return jsonOk({
    ok: true,
    jobs: results,
  });
}
