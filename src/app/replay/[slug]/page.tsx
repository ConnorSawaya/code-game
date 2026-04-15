import { notFound } from "next/navigation";
import { getReplayBySlug } from "@/features/replays/queries";
import { ReplayViewer } from "@/features/replays/replay-viewer";

export const dynamic = "force-dynamic";

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const replay = await getReplayBySlug(slug);

  if (!replay) {
    notFound();
  }

  return <ReplayViewer replay={replay} />;
}
