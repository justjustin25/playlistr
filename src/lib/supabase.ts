import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ Share a song post (without profile_image and display_name)
export async function shareSong({
  userId,
  spotifyId,
  trackName,
  artistName,
  albumCover,
  caption,
  tags,
}: {
  userId: string;
  spotifyId: string;
  trackName: string;
  artistName: string;
  albumCover: string;
  caption: string;
  tags?: string;
}) {
  const { data, error } = await supabase.from('posts').insert([
    {
      user_id: userId,
      spotify_id: spotifyId,
      track_name: trackName,
      artist_name: artistName,
      album_cover: albumCover,
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

// ✅ Fetch all posts
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

// ✅ Share a playlist post (without profile_image and display_name)
export async function sharePlaylist({
  userId,
  spotifyId,
  trackName,
  artistName,
  albumCover,
  caption,
  tags,
}: {
  userId: string;
  spotifyId: string;
  trackName: string;
  artistName: string;
  albumCover: string;
  caption?: string;
  tags?: string;
}) {
  const { error } = await supabase.from('posts').insert([
    {
      user_id: userId,
      spotify_id: spotifyId,
      track_name: trackName,
      artist_name: artistName,
      album_cover: albumCover,
      type: 'playlist',
      caption,
      tags,
    },
  ]);

  if (error) {
    console.error('Error sharing playlist:', error.message);
  }
}
