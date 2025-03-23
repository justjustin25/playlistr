'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState } from 'react';
import Feed from '@/components/Feed';
import SpotifySearchCard from '@/components/SpotifySongCard';
import SpotifyPlaylistCard from './SpotifyPlaylistCard';

export default function HomeContent() {
  const { data: session, status } = useSession();
  const [refreshFeed, setRefreshFeed] = useState(false);
  const [showSongCard, setShowSongCard] = useState(false);
  const [showPlaylistCard, setShowPlaylistCard] = useState(false);

  const handlePostShared = () => {
    setRefreshFeed(true);
    setTimeout(() => setRefreshFeed(false), 100);
  };

  const toggleCard = (type: 'song' | 'playlist') => {
    if (type === 'song') {
      setShowSongCard(!showSongCard);
      setShowPlaylistCard(false);
    } else {
      setShowPlaylistCard(!showPlaylistCard);
      setShowSongCard(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;
  }

  if (!session) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black text-white px-4 sm:px-6 md:px-10 py-6 md:py-10 text-center">
        <h1 className="text-5xl font-bold mb-2">Playlistr</h1>
        <p className="text-sm text-zinc-600 italic mb-4">(A Spotify Companion App)</p>
        <p className="text-xl text-zinc-400 mb-4">Your favorite music, shared your way.</p>

        <button
          onClick={() => signIn('spotify')}
          className="bg-green-500 hover:bg-green-600 text-black font-semibold py-3 px-6 rounded-full transition duration-200"
        >
          Log in with Spotify
        </button>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white px-4 sm:px-6 md:px-10 py-6 md:py-10">
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => toggleCard('song')}
          className={`px-4 py-2 rounded font-medium ${
            showSongCard ? 'bg-green-600 text-black' : 'bg-zinc-700 text-white hover:bg-zinc-600'
          }`}
        >
          Share a Song
        </button>
        <button
          onClick={() => toggleCard('playlist')}
          className={`px-4 py-2 rounded font-medium ${
            showPlaylistCard ? 'bg-green-600 text-black' : 'bg-zinc-700 text-white hover:bg-zinc-600'
          }`}
        >
          Share a Playlist
        </button>
      </div>

      {showSongCard && <SpotifySearchCard onPostShared={handlePostShared} onClose={() => setShowSongCard(false)}/>}
      {showPlaylistCard && <SpotifyPlaylistCard onPostShared={handlePostShared} onClose={() => setShowPlaylistCard(false)}/>}

      <Feed key={refreshFeed ? 'refresh' : 'static'} />
    </section>
  );
}
