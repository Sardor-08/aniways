import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { Navbar } from "@/components/navbar";
import { ScrollToTop } from "@/components/scroll-to-top";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aniways - Anime Streaming",
  description: "Stream your favorite anime",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen dotted-bg`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8">{children}</main>
            <footer className="border-t border-border/50 mt-auto py-2">
              <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                <div className="flex justify-center mt-2">
                  <span className="text-xl text-logo font-black m-2">
                    Aniways
                  </span>
                </div>
                <p>Copyright ©Aniways. All Rights Reserved</p>
                <p className="mt-1">
                  This site does not store any files on its server. All contents
                  are provided by non-affiliated third parties.
                </p>
                <div className="flex justify-center mt-3 mb-5">
                  <a
                    href="https://github.com/hazavi/aniways"
                    target="_blank"
                    title="Github Repo"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <i className="devicon-github-original text-3xl"></i>
                  </a>
                </div>
              </div>
            </footer>
            <ScrollToTop />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
