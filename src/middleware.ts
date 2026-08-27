import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/auth/login"];

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

    if (!user && !isPublicRoute) {
        const redirectUrl = new URL("/auth/login", request.url);
        const redirectResponse = NextResponse.redirect(redirectUrl);

        response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
        return redirectResponse;
    }

    if (user && isPublicRoute) {
        const redirectUrl = new URL("/dashboard", request.url);
        const redirectResponse = NextResponse.redirect(redirectUrl);

        response.cookies.getAll().forEach(cookie => redirectResponse.cookies.set(cookie));
        return redirectResponse;
    }

    return response;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};