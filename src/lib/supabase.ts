import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Share a song post
export async function shareSong({
  userId,
  spotifyId,
  caption,
  tags,
}: {
  userId: string;
  spotifyId: string;
  caption: string;
  tags?: string;
}) {
  const { data, error } = await supabase.from('posts').insert([
    {
      user_id: userId,
      spotify_id: spotifyId,
      type: 'song',
      caption: caption,
      tags: tags,
    },
  ]);

  if (error) {
    console.error('Error sharing song:', error.message);
    return null;
  }

  return data;
}


// Share a playlist post
export async function sharePlaylist({
  userId,
  spotifyId,
  caption,
  tags,
}: {
  userId: string;
  spotifyId: string;
  caption?: string;
  tags?: string;
}) {
  const { error } = await supabase.from('posts').insert([
    {
      user_id: userId,
      spotify_id: spotifyId,
      type: 'playlist',
      caption,
      tags,
    },
  ]);

  if (error) {
    console.error('Error sharing playlist:', error.message);
  }
}

// Fetch all posts
export async function getAllPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('shared_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error.message);
    return [];
  }

  return data;
}