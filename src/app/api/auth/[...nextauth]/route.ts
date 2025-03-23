import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

interface SpotifyProfile {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization:
        'https://accounts.spotify.com/authorize?scope=user-read-email user-read-private user-top-read user-read-playback-state',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const spotifyProfile = profile as SpotifyProfile;

        token.id = spotifyProfile.id;
        token.name = spotifyProfile.display_name;
        token.picture = spotifyProfile.images?.[0]?.url;
        token.accessToken = account.access_token;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }

      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
