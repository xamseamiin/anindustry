import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Redirect any attempt to access /dashboard or /shop to /manufacturing
        if (path === '/dashboard' || path.startsWith('/shop') || path.startsWith('/projects')) {
            return NextResponse.redirect(new URL('/manufacturing', req.url));
        }

        // Super Admin Protection
        if (path.startsWith('/admin')) {
            const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
            const role = token?.role as string | undefined;
            if (role !== 'SUPER_ADMIN' && token?.id !== SUPER_ADMIN_ID) {
               return NextResponse.redirect(new URL('/manufacturing?error=Unauthorized', req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/shop/:path*",
        "/projects/:path*",
        "/manufacturing/:path*",
        "/admin/:path*"
    ],
};
