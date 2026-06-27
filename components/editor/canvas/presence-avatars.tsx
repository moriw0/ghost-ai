"use client";

import { useOthers } from "@liveblocks/react";
import { UserButton, useUser } from "@clerk/nextjs";

export function PresenceAvatars() {
  const { user } = useUser();
  const others = useOthers();

  const collaborators = others.filter((other) => other.id !== user?.id);

  const maxVisible = 5;
  const visible = collaborators.slice(0, maxVisible);
  const overflowCount = collaborators.length - maxVisible;

  return (
    <div className="flex items-center gap-2">
      {visible.length > 0 && (
        <>
          <div className="flex items-center">
            {visible.map((other, index) => (
              <CollaboratorAvatar
                key={other.connectionId}
                info={other.info}
                isFirst={index === 0}
                stackIndex={maxVisible - index}
              />
            ))}
            {overflowCount > 0 && (
              <OverflowChip count={overflowCount} />
            )}
          </div>
          <div className="h-4 w-px bg-[var(--border-default)]" />
        </>
      )}
      <UserButton />
    </div>
  );
}

interface CollaboratorAvatarProps {
  info: { name: string; avatar: string; color: string };
  isFirst: boolean;
  stackIndex: number;
}

function CollaboratorAvatar({ info, isFirst, stackIndex }: CollaboratorAvatarProps) {
  const initials = info.name
    .split(" ")
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full"
      style={{
        marginLeft: isFirst ? "0" : "-8px",
        zIndex: stackIndex,
        boxShadow: `0 0 0 2px var(--bg-base), 0 0 0 3.5px ${info.color}`,
      }}
    >
      {info.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={info.avatar}
          alt={info.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-xs font-semibold"
          style={{
            backgroundColor: info.color + "33",
            color: info.color,
          }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

function OverflowChip({ count }: { count: number }) {
  return (
    <div
      className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium"
      style={{
        marginLeft: "-8px",
        zIndex: 0,
        backgroundColor: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 0 0 2px var(--bg-base)",
        color: "var(--text-secondary)",
      }}
    >
      +{count}
    </div>
  );
}
