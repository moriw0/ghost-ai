import { currentUser } from "@clerk/nextjs/server";

import { EditorHome } from "@/components/editor/editor-home";
import { getOwnedProjects, getSharedProjects } from "@/lib/projects";

export default async function EditorPage() {
  const user = await currentUser();

  const [ownedProjects, sharedProjects] = await Promise.all([
    user ? getOwnedProjects(user.id) : Promise.resolve([]),
    user
      ? getSharedProjects((user.primaryEmailAddress?.emailAddress ?? "").toLowerCase())
      : Promise.resolve([]),
  ]);

  return (
    <EditorHome ownedProjects={ownedProjects} sharedProjects={sharedProjects} />
  );
}
