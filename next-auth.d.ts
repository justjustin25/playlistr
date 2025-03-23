import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      id?: string; // ✅ Spotify user ID
    };
    accessToken?: string; // ✅ your access token
  }
}
