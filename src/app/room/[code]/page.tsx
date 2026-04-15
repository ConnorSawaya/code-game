import { getPromptLibrary } from "@/features/prompts/library";
import { RoomClient } from "@/features/rooms/room-client";
import { getRoomViewData } from "@/features/rooms/queries";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [roomViewData, promptLibrary] = await Promise.all([
    getRoomViewData(code),
    Promise.resolve(getPromptLibrary()),
  ]);

  return <RoomClient initialData={roomViewData} promptLibrary={promptLibrary} />;
}
