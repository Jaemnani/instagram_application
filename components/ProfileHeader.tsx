import Image from "next/image";

import { instagramUrl, siteConfig } from "@/lib/config";
import type { Profile } from "@/lib/instagram/types";

function stat(label: string, value: number | undefined) {
  if (value === undefined) return null;
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{value.toLocaleString("ko-KR")}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}

export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <section className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
      {profile.profilePicture && (
        <Image
          src={profile.profilePicture.src}
          alt={profile.profilePicture.alt}
          width={120}
          height={120}
          preload
          className="h-28 w-28 rounded-full object-cover ring-1 ring-neutral-200"
        />
      )}
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <a
            href={instagramUrl(profile.username || siteConfig.instagramHandle)}
            target="_blank"
            rel="noopener noreferrer me"
            className="text-sm font-medium text-rose-600 hover:underline"
          >
            @{profile.username || siteConfig.instagramHandle}
          </a>
        </div>

        {profile.biography && (
          <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed text-neutral-700">
            {profile.biography}
          </p>
        )}

        <div className="mt-4 flex justify-center gap-8 sm:justify-start">
          {stat("게시물", profile.mediaCount)}
          {stat("팔로워", profile.followersCount)}
        </div>
      </div>
    </section>
  );
}
