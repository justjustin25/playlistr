'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { searchPlaylists } from '@/lib/spotify';
import { sharePlaylist } from '@/lib/supabase';

interface SpotifyPlaylistCardProps {
  onPostShared?: () => void;
  onClose?: () => void;
}

export default function SpotifyPlaylistCard({ onPostShared, onClose }: SpotifyPlaylistCardProps) {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<any | null>(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query || !session?.accessToken) return;
      setLoading(true);
      try {
        const playlists = await searchPlaylists(query, session.accessToken);
        const publicPlaylists = playlists.filter(
          (playlist: any) => playlist && playlist.public === true
        );
        setResults(publicPlaylists);
      } catch (err) {
        console.error('Playlist search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, session?.accessToken]);

  const handleShare = async () => {
    if (!selectedPlaylist || !session?.user?.id) return;

    await sharePlaylist({
      userId: session.user.id,
      spotifyId: selectedPlaylist.id,
      caption,
      tags,
    });

    setSelectedPlaylist(null);
    setCaption('');
    setTags('');
    setQuery('');
    setResults([]);
    onPostShared?.();
    onClose?.(); // Optionally auto-close
  };

  return (
    <div className="relative bg-zinc-800 p-6 rounded-lg shadow mb-8 max-w-3xl mx-auto">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
      )}

      <h2 className="text-xl font-semibold mb-4 text-white">Search a playlist to share</h2>

      <input
        type="text"
        placeholder="Search for a playlist..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 rounded bg-zinc-700 text-white placeholder:text-zinc-400 mb-4"
      />

      {loading && <p className="text-sm text-zinc-400">Searching...</p>}

      {selectedPlaylist && (
        <div className="bg-zinc-900 p-4 rounded mb-4">
          <div className="flex items-center gap-4 mb-4">
            {selectedPlaylist.images?.[0]?.url ? (
              <img
                src={selectedPlaylist.images[0].url}
                alt={selectedPlaylist.name}
                className="w-12 h-12 rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center text-xs text-zinc-400">
                N/A
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{selectedPlaylist.name}</p>
              <p className="text-sm text-zinc-400">
                by {selectedPlaylist.owner?.display_name ?? 'Unknown'}
              </p>
            </div>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)"
            className="w-full p-2 rounded bg-zinc-700 text-white placeholder:text-zinc-400 mb-2"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags (e.g. Workout, Chill)"
            className="w-full p-2 rounded bg-zinc-700 text-white placeholder:text-zinc-400 mb-4"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setSelectedPlaylist(null);
                setCaption('');
                setTags('');
              }}
              className="text-sm text-zinc-400 hover:underline"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              className="bg-green-500 hover:bg-green-600 text-black px-4 py-1 rounded text-sm font-semibold"
            >
              Share
            </button>
          </div>
        </div>
      )}

      {!selectedPlaylist &&
        results.map((playlist) => (
          <div
            key={playlist.id}
            className="flex items-center justify-between bg-zinc-900 p-3 rounded mb-2"
          >
            <div className="flex items-center gap-4">
              {playlist.images?.[0]?.url ? (
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="w-12 h-12 rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center text-xs text-zinc-400">
                  N/A
                </div>
              )}
              <div>
                <p className="text-white font-semibold">{playlist.name}</p>
                <p className="text-sm text-zinc-400">
                  by {playlist.owner?.display_name ?? 'Unknown'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPlaylist(playlist)}
              className="bg-green-500 hover:bg-green-600 text-black px-3 py-1 rounded text-sm font-semibold"
            >
              Share
            </button>
          </div>
        ))}
    </div>
  );
}
