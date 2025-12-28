import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "artisan" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // This is a temporary demo login
                // In a real app, you would verify against a database here
                if (credentials?.username === "artisan" && credentials?.password === "thoub123") {
                    return { id: "1", name: "Artisan Admin", email: "admin@thoub-ai.tech" }
                }
                return null
            }
        }),
    ],
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.id;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/try-on")
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            }
            return true
        },
    },
})
