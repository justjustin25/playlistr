'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getAllPosts, getCommentsForPost, commentOnPost } from '@/lib/supabase';


interface Post {
  id: string;
  shared_at: string;
  user_id: string;
  spotify_id: string;
  type: string;
  caption?: string;
  tags?: string;
  comments?: Comment[];
}

interface UserProfile {
  display_name: string;
  images: { url: string }[];
}

interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  comment: string;
  shared_at: string;
}

export default function Feed() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [postId: string]: string }>({});


  useEffect(() => {
    async function fetchPosts() {
      const data = await getAllPosts();

      // Fetch comments for each post and attach them
      const postsWithComments = await Promise.all(
        data.map(async (post) => {
          const comments = await getCommentsForPost(post.id);
          return {
            ...post,
            comments: comments || [],
          };
        })
      );

      setPosts(postsWithComments);

      // Collect unique user IDs (from post authors + commenters)
      const userIds = new Set<string>();
      postsWithComments.forEach((post: Post) => {
        userIds.add(post.user_id);
        post.comments?.forEach((comment: Comment) => {
          userIds.add(comment.user_id);
        });
      });

      // Fetch profiles for all unique user IDs
      const profilesMap = new Map<string, UserProfile>();
      for (const userId of userIds) {
        if (!profilesMap.has(userId)) {
          const res = await fetch(`https://api.spotify.com/v1/users/${userId}`, {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          });

          const userProfile: UserProfile = await res.json();
          profilesMap.set(userId, userProfile);
        }
      }

      setUserProfiles(profilesMap);
      setLoading(false);
    }

    fetchPosts();
  }, [session]);

  async function handleCommentSubmit(postId: string) {
    const commentText = newComment[postId]?.trim();
    if (!commentText || !session?.user?.id) return;
  
    const result = await commentOnPost({
      userId: session.user.id,
      postId,
      comment: commentText,
    });
  
    if (!result || result.length === 0) {
      console.warn('Insert may have failed, result:', result);
      return;
    }
  
    // Get the returned comment
    const newCommentObj = result[0];

    // Update posts state
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...(post.comments || []), newCommentObj],
            }
          : post
      )
    );
  
    // Clear input
    setNewComment((prev) => ({ ...prev, [postId]: '' }));
  }

  if (loading) return (
    <div className="text-zinc-400 text-center mt-8 flex flex-col items-center gap-2">
      <div className="flex space-x-1">
        <span className="w-4 h-4 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-4 h-4 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-4 h-4 bg-green-400 rounded-full animate-bounce" />
      </div>
      <span>Loading</span>
    </div>
  );

  if (posts.length === 0) return <p className="text-zinc-400 text-center mt-8">No posts yet!</p>;

  return (
    <div className="space-y-6 px-4">
      {posts.map((post) => {
        const isCurrentUser = session?.user?.id === post.user_id;
        const profileLink = isCurrentUser ? '/profile' : `/user/${post.user_id}`;
        const userProfile = userProfiles.get(post.user_id);

        return (
          <div
            key={post.id}
            className="p-4 bg-zinc-800 rounded-xl shadow max-w-xl w-full mx-auto space-y-3"
          >
            {/* Spotify iframe */}
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

            {/* Caption */}
            {post.caption && (
              <p className="text-sm text-zinc-300 italic">“{post.caption}”</p>
            )}

            {/* Tags */}
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

            {/* User Profile */}
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

            {/* Comments Toggle */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() =>
                  setExpandedPostId((prev) => (prev === post.id ? null : post.id))
                }
                className="text-xs text-green-400 hover:underline focus:outline-none text-right"
              >
                {expandedPostId === post.id ? 'Hide' : 'View'} Comments
              </button>
            </div>

            {/* Comments Section */}
            {expandedPostId === post.id && (
              <div className="mt-2 border-t border-zinc-700 pt-2 space-y-3">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => {
                    const commenterProfile = userProfiles.get(comment.user_id);
                    return (
                      <div key={comment.comment_id} className="flex items-start gap-2">
                        <Link
                          href={
                            comment.user_id === session?.user?.id
                              ? '/profile'
                              : `/user/${comment.user_id}`
                          }
                          className="mt-1 min-w-max"
                          >
                          {commenterProfile?.images?.[0]?.url && (
                            <img
                              src={commenterProfile.images[0].url}
                              alt={commenterProfile.display_name}
                              className="w-6 h-6 rounded-full hover:opacity-80 transition"
                            />
                          )}
                        </Link>
                        <div>
                        <Link
                            href={
                              comment.user_id === session?.user?.id
                                ? '/profile'
                                : `/user/${comment.user_id}`
                            }
                          >
                            <p className="text-xs text-zinc-400 font-semibold hover:underline">
                              {commenterProfile?.display_name || 'Unknown'}
                            </p>
                          </Link>
                          <p className="text-sm text-zinc-300">{comment.comment}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-zinc-500 italic">No comments yet.</p>
                )}

                <div className="flex items-center gap-2 mt-2">
                <textarea
                    placeholder="Add a comment..."
                    value={newComment[post.id] || ''}
                    onChange={(e) =>
                      setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    className="flex-1 p-2 rounded bg-zinc-700 text-sm text-white"
                  />
                
                  <button
                    onClick={() => handleCommentSubmit(post.id)}
                    className="bg-green-500 hover:bg-green-600 text-black px-4 py-1 rounded text-sm font-semibold"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
