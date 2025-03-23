export async function searchTracks(query: string, accessToken: string) {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  
    if (!res.ok) {
      console.error('Spotify search failed:', res.statusText);
      return [];
    }
  
    const data = await res.json();
    return data.tracks?.items || [];
}

export async function searchPlaylists(query: string, accessToken: string) {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  return data.playlists?.items || [];
}

export async function getSpotifyUserProfile(userId: string, accessToken: string) {
  const response = await fetch(`https://api.spotify.com/v1/users/${userId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Spotify user profile');
  }

  const data = await response.json();
  return data;
}
