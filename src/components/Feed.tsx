'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getAllPosts } from '@/lib/supabase';

interface Post {
  id: string;
  shared_at: string;
  user_id: string;
  spotify_id: string;
  type: string;
  caption?: string;
  tags?: string;
}

interface UserProfile {
  display_name: string;
  images: { url: string }[];
}

export default function Feed() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const data = await getAllPosts();
      setPosts(data);

      // Fetch user profiles based on user_id for each post
      const profilesMap = new Map();
      for (const post of data) {
        const userId = post.user_id;
        // Check if the user profile is already fetched, if not get it
        if (!profilesMap.has(userId)) {
          const res = await fetch(`https://api.spotify.com/v1/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          });

          // Create a new user profile object and add it to the Map
          const userProfile: UserProfile = await res.json();
          profilesMap.set(userId, userProfile);
        }
      }

      setUserProfiles(profilesMap);
      setLoading(false);
    }

    fetchPosts();
  }, [session]);

  if (loading) return (
    <div className="text-zinc-400 text-center mt-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-400 mb-4"></div>
      <p className="text-zinc-400">Loading content...</p>
    </div>
  );

  if (posts.length === 0) return <p className="text-zinc-400 text-center mt-8">No posts yet!</p>;

  return (
    <div className="space-y-6 px-4">
      {posts.map((post) => {
        const isCurrentUser = session?.user?.id === post.user_id;
        const profileLink = isCurrentUser ? '/profile' : `/user/${post.user_id}`;
        const userProfile = userProfiles.get(post.user_id); // Get user profile from the Map

        return (
          <div
            key={post.id}
            className="p-4 bg-zinc-800 rounded-xl shadow max-w-xl w-full mx-auto space-y-3"
          >
            
            <iframe
              src={
                post.type === 'playlist'
                  ? `https://open.spotify.com/embed/playlist/${post.spotify_id}`
                  : `https://open.spotify.com/embed/track/${post.spotify_id}`
              }
              width="100%"
              height={post.type === 'playlist' ? '152' : '80'}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
              className="rounded"
            />
            {post.caption && (
              <p className="text-sm text-zinc-300 italic">“{post.caption}”</p>
            )}

            {post.tags && (
              <div className="flex flex-wrap gap-2 mt-1">
                {post.tags
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-green-400 bg-zinc-700 px-2 py-1 rounded-full"
                    >
                      #{tag.replace(/\s+/g, '').toLowerCase()}
                    </span>
                  ))}
              </div>
            )}

            <Link
              href={profileLink}
              className="flex items-center gap-2 group"
            >
              {userProfile?.images && userProfile.images.length > 0 && (
                <img
                  src={userProfile.images[0]?.url}
                  alt={userProfile.display_name}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <p className="text-zinc-500 text-xs group-hover:underline">
                Shared by {userProfile?.display_name || 'Unknown'}
              </p>
            </Link>
          </div>
        );
      })}
    </div>
  );
}