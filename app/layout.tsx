import HeaderAuth from "@/components/header-auth";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "./providers";
import { createClient } from "@/utils/supabase/server";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const artistId = user?.id;

  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          <main className="min-h-screen flex flex-col items-center">
            <div className=" w-full flex flex-col items-center">
              <nav className="w-full flex justify-between border-b border-b-foreground/10 h-16 items-center px-8">
                <div className="flex flex-row gap-4">
                  <Link href="/" className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </Link>
                  <div className="flex gap-4">
                    <Link href="/upload">Upload Song</Link>
                    <Link href="/songs">My Songs</Link>
                    {artistId && (
                      <Link href={`/feedback?artistId=${artistId}`}>
                        Feedback
                      </Link>
                    )}
                    <Link href="/create-feedback">Create Feedback</Link>
                    <Link href="/feedback/2b515e12-843e-435f-a4ac-841a1a951d98">
                      Meraki!!!
                    </Link>
                  </div>
                </div>
                <HeaderAuth />
              </nav>
              <div className="flex flex-col w-full p-5">{children}</div>
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
