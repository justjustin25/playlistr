'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { getSpotifyUserProfile } from '@/lib/spotify';
import { getAllPosts } from '@/lib/supabase'; 

interface UserProfile {
  display_name: string;
  images: { url: string }[];
  followers: { total: number };
  external_urls: { spotify: string };
}

interface Post {
  id: string;
  track_name: string;
  artist_name: string;
  album_cover: string;
  shared_at: string;
  user_id: string;
  spotify_id: string;
  type: string;  // 'song' or 'playlist'
  caption?: string;
  tags?: string;
}

export default function UserPage() {
  const { data: session } = useSession();
  const { id } = useParams(); // Get the user ID from the URL
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  // Fetch the user's Spotify profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.accessToken && id) {
        try {
          const userProfile = await getSpotifyUserProfile(id as string, session.accessToken);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id, session]);

  // Fetch posts shared by the user
  useEffect(() => {
    const fetchPosts = async () => {
      if (id) {
        const data = await getAllPosts();
        setPosts(data.filter((post) => post.user_id === id));
      }
    };

    if (id) {
      fetchPosts();
    }
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!profile) return <p>Unable to find user profile.</p>;

  return (
    <section className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white px-10 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left side – Profile Info */}
        <div className="flex flex-col items-start justify-start gap-4">
          {profile.images.length > 0 && (
            <img
              src={profile.images[0]?.url}
              alt="Profile"
              className="w-40 h-40 rounded-full border-4 border-green-500 shadow-xl"
            />
          )}

          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-zinc-400 space-y-1">
            <strong>Followers:</strong> {profile.followers.total}
          </p>

          <a
            href={profile.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-6 rounded-full transition duration-200"
          >
            View on Spotify
          </a>
        </div>

        {/* Right side – Shared songs/playlists */}
        <div className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold mb-4">Shared Songs & Playlists</h2>
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-zinc-800 p-6 rounded-xl shadow">
                  <iframe
                    src={
                      post.type === 'playlist'
                        ? `https://open.spotify.com/embed/playlist/${post.spotify_id}`
                        : `https://open.spotify.com/embed/track/${post.spotify_id}`
                    }
                    width="100%"
                    height={post.type === 'playlist' ? '152' : '80'}
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="rounded"
                  />
                  {post.caption && (
                    <p className="text-sm text-zinc-300 italic mt-4">“{post.caption}”</p>
                  )}
                  {post.tags && (
                    <div className="flex flex-wrap gap-2 mt-2">
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
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">No posts shared yet!</p>
          )}
        </div>
      </div>
    </section>
  );
}
