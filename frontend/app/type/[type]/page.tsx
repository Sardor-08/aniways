"use client";

import { useEffect, useState, use } from "react";
import { api, type Anime } from "@/lib/api";
import { AnimeGrid, AnimeGridSkeleton } from "@/components/anime-grid";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const typeLabels: Record<string, string> = {
  tv: "TV Series",
  movie: "Movies",
  ova: "OVAs",
  ona: "ONAs",
  special: "Specials",
  music: "Music",
};

const validTypes = ["tv", "movie", "ova", "ona", "special", "music"];

interface TypePageProps {
  params: Promise<{ type: string }>;
}

export default function TypePage({ params }: TypePageProps) {
  const { type } = use(params);
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const isValidType = validTypes.includes(type.toLowerCase());
  const title = typeLabels[type.toLowerCase()] || `${type.toUpperCase()} Anime`;

  useEffect(() => {
    document.title = `${title} - Aniways`;
  }, [title]);

  useEffect(() => {
    if (isValidType) {
      fetchByType(1);
    } else {
      setLoading(false);
    }
  }, [type]);

  async function fetchByType(pageNum: number) {
    setLoading(true);
    try {
      const res = await api.getTopAnime("", pageNum, 24, type.toLowerCase());
      setResults(res.data || []);
      setHasNextPage(res.pagination?.has_next_page || false);
      setTotalPages(res.pagination?.last_visible_page || 1);
    } catch (error) {
      console.error("Fetch by type failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchByType(newPage);
  };

  if (!isValidType) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          Invalid anime type: &quot;{type}&quot;
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Valid types: {validTypes.join(", ")}
        </p>
      </div>
    );
  }

  if (loading) {
    return <AnimeGridSkeleton count={24} title={title} compact />;
  }

  return (
    <div className="space-y-8 mt-10 px-4 md:px-10 lg:px-20">
      {results.length > 0 ? (
        <>
          <AnimeGrid anime={results} title={title} compact />

          {/* Pagination */}
          {(hasNextPage || page > 1) && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="gap-2 hover:cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={!hasNextPage}
                className="gap-2 hover:cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No {title} found</p>
        </div>
      )}
    </div>
  );
}
