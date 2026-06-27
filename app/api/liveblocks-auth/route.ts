import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getLiveblocks, getCursorColor } from "@/lib/liveblocks";
import { getProjectWithAccess } from "@/lib/project-access";

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { room } = await request.json();
  if (!room || typeof room !== "string") {
    return new NextResponse("Missing room", { status: 400 });
  }

  const user = await currentUser();
  const email = (user?.primaryEmailAddress?.emailAddress ?? "").toLowerCase();

  const project = await getProjectWithAccess(room, userId, email);
  if (!project) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const name =
    user?.fullName ??
    user?.firstName ??
    user?.username ??
    email ??
    "Anonymous";
  const avatar = user?.imageUrl ?? "";
  const color = getCursorColor(userId);

  const liveblocks = getLiveblocks();

  try {
    await liveblocks.getRoom(room);
  } catch {
    await liveblocks.createRoom(room, {
      defaultAccesses: [],
    });
  }

  const session = liveblocks.prepareSession(userId, {
    userInfo: { name, avatar, color },
  });
  session.allow(room, ["*:write"]);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
