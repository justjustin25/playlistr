'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { searchTracks } from '@/lib/spotify';
import { shareSong } from '@/lib/supabase';

interface SpotifySongCardProps {
  onPostShared?: () => void;
  onClose?: () => void;
}

export default function SpotifySongCard({ onPostShared, onClose }: SpotifySongCardProps) {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any | null>(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!query || !session?.accessToken) return;
      setLoading(true);
      try {
        const tracks = await searchTracks(query, session.accessToken);
        setResults(tracks);
      } catch (err) {
        console.error('Track search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, session?.accessToken]);

  const handleShare = async () => {
    if (!selectedTrack || !session?.user?.id) return;

    await shareSong({
      userId: session.user.id,
      spotifyId: selectedTrack.id,
      caption,
      tags,
    });

    setSelectedTrack(null);
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

      <h2 className="text-xl font-semibold mb-4 text-white">Search a song to share</h2>

      <input
        type="text"
        placeholder="Search for a song..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 rounded bg-zinc-700 text-white placeholder:text-zinc-400 mb-4"
      />

      {loading && <p className="text-sm text-zinc-400">Searching...</p>}

      {selectedTrack && (
        <div className="bg-zinc-900 p-4 rounded mb-4">
          <div className="flex items-center gap-4 mb-4">
            {selectedTrack.album?.images?.[0]?.url ? (
              <img
                src={selectedTrack.album.images[0].url}
                alt={selectedTrack.name}
                className="w-12 h-12 rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center text-xs text-zinc-400">
                N/A
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{selectedTrack.name}</p>
              <p className="text-sm text-zinc-400">
                by {selectedTrack.artists.map((a: any) => a.name).join(', ')}
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
            placeholder="Add tags (e.g. R&B, Classics)"
            className="w-full p-2 rounded bg-zinc-700 text-white placeholder:text-zinc-400 mb-4"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setSelectedTrack(null);
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

      {!selectedTrack &&
        results.map((track) => (
          <div
            key={track.id}
            className="flex items-center justify-between bg-zinc-900 p-3 rounded mb-2"
          >
            <div className="flex items-center gap-4">
              {track.album?.images?.[0]?.url ? (
                <img
                  src={track.album.images[0].url}
                  alt={track.name}
                  className="w-12 h-12 rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center text-xs text-zinc-400">
                  N/A
                </div>
              )}
              <div>
                <p className="text-white font-semibold">{track.name}</p>
                <p className="text-sm text-zinc-400">
                  by {track.artists.map((a: any) => a.name).join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTrack(track)}
              className="bg-green-500 hover:bg-green-600 text-black px-3 py-1 rounded text-sm font-semibold"
            >
              Share
            </button>
          </div>
        ))}
    </div>
  );
}
