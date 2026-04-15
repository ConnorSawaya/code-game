import { PublicRoomsBoard } from "@/features/public-rooms/public-rooms-board";
import { getPublicRoomSummaries } from "@/features/rooms/queries";

export const dynamic = "force-dynamic";

export default async function PublicRoomsPage() {
  const rooms = await getPublicRoomSummaries();

  return <PublicRoomsBoard rooms={rooms} />;
}
