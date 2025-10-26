import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Create the client with auth endpoint for v2
const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Define types for presence and storage
export type Presence = {
  cursor: { x: number; y: number } | null;
  name?: string;
  avatar?: string;
  color?: string;
  isTyping?: boolean;
  lastSeen?: number;
};

export type Storage = {
  content: string;
};

// Create room context with v2 API
export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useOthers,
    useMutation,
    useStorage,
    useSelf,
  },
} = createRoomContext<Presence, Storage>(client);

export { client };