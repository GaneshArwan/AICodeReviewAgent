import "@/lib/bootstrap"; // fail-fast env validation (Rule 1)
import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { rateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: { params: { scope: "repo read:user user:email" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

// wrap NextAuth handler with rate limiting (Rule 7)
async function rateLimitedHandler(req: Request, context: any) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!rateLimit(`auth_${ip}`, 30, 60000)) {
    return new Response(JSON.stringify({ error: "Too many authentication requests. Please try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }
  return handler(req, context);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };

