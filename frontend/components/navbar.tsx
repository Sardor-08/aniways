"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Loader2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLanguage } from "@/components/language-provider";
import { api, type Anime } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const types = [
  { name: "Movies", href: "/type/movie" },
  { name: "TV Series", href: "/type/tv" },
  { name: "OVAs", href: "/type/ova" },
  { name: "ONAs", href: "/type/ona" },
  { name: "Specials", href: "/type/special" },
];

const browse = [
  { name: "New Releases", href: "/browse/new-releases" },
  { name: "Popular", href: "/browse/popular" },
  { name: "Top Rated", href: "/browse/top-rated" },
];

export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { language, setLanguage } = useLanguage();
  const { getTitle } = useLanguage();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchAnime(query, 1);
        // Deduplicate by mal_id to avoid duplicate key errors
        const unique = res.data?.filter(
          (anime: Anime, index: number, self: Anime[]) =>
            index === self.findIndex((a) => a.mal_id === anime.mal_id)
        );
        setSuggestions(unique?.slice(0, 6) || []);
      } catch (error) {
        console.error("Search failed:", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (anime: Anime) => {
    setShowSuggestions(false);
    setQuery("");
    router.push(`/anime/${anime.mal_id}`);
  };

  return (
    <header className="relative top-5 z-50 mx-auto max-w-6xl border rounded-full px-6 border-border/50 shadow-sm ">
      <div className="flex h-14 items-center justify-between gap-4">
        <Link href="/" className="text-xl font-black shrink-0 text-logo">
          Aniways
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/schedule"
            className="px-3 py-2 text-sm font-medium rounded-full hover:bg-accent/50 transition-colors cursor-pointer"
          >
            Schedule
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-full hover:bg-accent/50 transition-colors cursor-pointer outline-none">
              Types
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {types.map((type) => (
                <DropdownMenuItem
                  key={type.name}
                  asChild
                  className="hover:cursor-pointer"
                >
                  <Link href={type.href}>{type.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-full hover:bg-accent/50 transition-colors cursor-pointer outline-none">
              Browse
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {browse.map((item) => (
                <DropdownMenuItem
                  key={item.name}
                  asChild
                  className="hover:cursor-pointer"
                >
                  <Link href={item.href}>{item.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div
          ref={searchRef}
          className="relative hidden sm:block flex-1 max-w-xs"
        >
          <form onSubmit={handleSearch}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
            )}
            <Input
              ref={inputRef}
              type="search"
              placeholder="Search anime..."
              className="w-full pl-10 pr-4 rounded-full border-border/50 bg-background/50 focus:bg-background/80 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
            />
          </form>

          {/* Search Dropdown */}
          {showSuggestions && query.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background/80 backdrop-blur-xs border-border/50 rounded-xl shadow-xl overflow-hidden z-50">
              {isSearching ? (
                <div className="p-3 text-center text-muted-foreground text-sm">
                  Searching...
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  {suggestions.map((anime) => (
                    <button
                      key={anime.mal_id}
                      onClick={() => handleSuggestionClick(anime)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent/50 transition-colors text-left hover:cursor-pointer"
                    >
                      <img
                        src={anime.images.jpg.image_url}
                        alt={anime.title}
                        className="w-10 h-14 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getTitle(anime)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <span>
                            {anime.type} • {anime.year || "N/A"}
                            {anime.type !== "Movie" && anime.episodes
                              ? ` • ${anime.episodes} Ep`
                              : ""}
                          </span>
                          {anime.score && (
                            <span className="flex items-center gap-0.5">
                              • <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                              {anime.score}
                            </span>
                          )}
                        </p>
                        {anime.genres && anime.genres.length > 0 && (
                          <p className="text-xs text-muted-foreground/70 truncate">
                            {anime.genres.slice(0, 3).map((g: { name: string }) => g.name).join(", ")}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="w-full py-2 px-3 text-sm text-purple-400 hover:bg-accent/50 transition-colors border-t border-border/50 hover:cursor-pointer text-center"
                  >
                    View all results for &quot;{query}&quot;
                  </button>
                </>
              ) : (
                <div className="p-3 text-center text-muted-foreground text-sm">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Language Toggle */}
          <div className="flex items-center rounded-full bg-muted p-1">
            <button
              onClick={() => setLanguage("en")}
              className={`hover:cursor-pointer px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                language === "en"
                  ? "bg-purple-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              en
            </button>
            <button
              onClick={() => setLanguage("jp")}
              className={`hover:cursor-pointer px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                language === "jp"
                  ? "bg-purple-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              jp
            </button>
          </div>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
