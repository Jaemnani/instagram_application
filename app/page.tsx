import { JsonLd } from "@/components/JsonLd";
import { PostListItem } from "@/components/PostListItem";
import { ProfileHeader } from "@/components/ProfileHeader";
import { getInstagramData } from "@/lib/data";
import { imageGalleryLd } from "@/lib/seo/jsonld";

export default async function HomePage() {
  const { profile, posts } = await getInstagramData();

  return (
    <div className="space-y-10">
      <JsonLd data={imageGalleryLd(posts)} />

      <ProfileHeader profile={profile} />

      <section aria-labelledby="feed-heading">
        <h2 id="feed-heading" className="sr-only">
          {profile.name} 인스타그램 게시물
        </h2>

        {posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
            아직 동기화된 게시물이 없습니다. <code>npm run sync</code> 를 실행하세요.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {posts.map((post) => (
              <PostListItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
