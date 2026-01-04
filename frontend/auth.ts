import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt", // Use JWT for credentials provider compatibility
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user || !user.password) {
                    // User doesn't exist or has no password
                    return null;
                }

                // Verify password
                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                };
            }
        }),
    ],
    pages: {
        signIn: "/auth/signin",
        error: "/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            // On initial sign in, add user id to token
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const protectedRoutes = ['/capture', '/try-on', '/dashboard'];
            const isProtectedRoute = protectedRoutes.some(route =>
                nextUrl.pathname.startsWith(route)
            );

            if (isProtectedRoute && !isLoggedIn) {
                return false; // Redirect to login
            }
            return true;
        },
    },
    events: {
        async createUser({ user }) {
            // When a new user is created via OAuth, give them starter credits
            if (user.id) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        measurementCredits: 1,
                        generationCredits: 3,
                    }
                });
            }
        }
    }
});
