'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  // Fetch user profile
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
  
    const fetchUserProfile = async () => {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
  
      const data = await res.json();
      if (data?.id) {
        setUserProfile(data);
      }
    };
  
    fetchUserProfile();
  }, [session?.accessToken]);
  

  // Fetch currently playing track
  const [nowPlaying, setNowPlaying] = useState<any>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
  
    const fetchCurrentlyPlaying = async () => {
      const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });
  
      if (res.status === 204) {
        setNowPlaying(null); // nothing currently playing
        return;
      }
  
      const data = await res.json();
  
      if (data?.item) {
        setNowPlaying({
          name: data.item.name,
          artist: data.item.artists.map((a: any) => a.name).join(', '),
          album: data.item.album.name,
          image: data.item.album.images[0].url,
          url: data.item.external_urls.spotify,
        });
      }
    };
  
    // Call once right away
    fetchCurrentlyPlaying();
  
    // Set interval for auto-refresh
    const interval = setInterval(fetchCurrentlyPlaying, 15000); // every 15 seconds
  
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [session?.accessToken]);
  

  // Fetch user's top tracks
  const [topTracks, setTopTracks] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchTopTracks = async () => {
      const res = await fetch(
        'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5',
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const data = await res.json();
      if (data?.items) {
        setTopTracks(data.items);
      }
    };

    fetchTopTracks();
  }, [session?.accessToken]);


  if (status === 'loading') return <p className="text-center mt-10">Loading...</p>;
  if (!session) return <p className="text-center mt-10">You must be signed in to view your profile.</p>;

  const { user } = session;

  return (
    <section className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white px-10 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left side – Profile Info */}
        <div className="flex flex-col items-start justify-start gap-4">
          {user?.image && (
            <img
              src={user.image}
              alt="Profile"
              className="w-40 h-40 rounded-full border-4 border-green-500 shadow-xl"
            />
          )}

          <h1 className="text-3xl font-bold">{user?.name}</h1>
          <p className='text-sm text-zinc-400 space-y-1'><strong>Followers:</strong> {userProfile?.followers?.total}</p>

          <a
            href={userProfile?.external_urls?.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-6 rounded-full transition duration-200"
          >
            View on Spotify
          </a>
        </div>

        
        <div className="flex flex-col gap-6">
          {/* Now Playing */}
          <div className="bg-zinc-800 p-6 rounded-xl shadow">
            <h2 className="text-2xl font-semibold mb-4">Currently Playing</h2>

            {nowPlaying ? (
              <div className="flex items-center gap-4">
                <img
                  src={nowPlaying.image}
                  alt="Album Art"
                  className="w-16 h-16 rounded shadow"
                />
                <div>
                  <p className="text-lg font-bold">{nowPlaying.name}</p>
                  <p className="text-sm text-zinc-400">{nowPlaying.artist}</p>
                  <p className="text-sm italic text-zinc-500">{nowPlaying.album}</p>
                  <a
                    href={nowPlaying.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:underline text-sm"
                  >
                    Open in Spotify
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-zinc-400">Not playing anything right now</p>
            )}
          </div>

          {/* Top Tracks */}
          <div className="bg-zinc-800 p-6 rounded-xl shadow">
            <h2 className="text-2xl font-semibold mb-4">Your Top Tracks</h2>
            {topTracks.length > 0 ? (
              <ul className="space-y-3">
                {topTracks.map((track, index) => (
                  <li key={track.id} className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400">{index + 1}.</span>
                    <img
                      src={track.album.images[2]?.url}
                      alt={track.name}
                      className="w-10 h-10 rounded"
                    />
                    <div>
                      <p className="font-medium text-white">{track.name}</p>
                      <p className="text-sm text-zinc-400">
                        {track.artists.map((artist: any) => artist.name).join(', ')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-400">No top tracks available.</p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
