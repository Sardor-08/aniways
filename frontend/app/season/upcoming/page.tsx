"use client";

import { useEffect, useState } from "react";
import { api, type Anime } from "@/lib/api";
import { AnimeGrid, AnimeGridSkeleton } from "@/components/anime-grid";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function UpcomingSeasonPage() {
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSeason(1);
  }, []);

  async function fetchSeason(pageNum: number) {
    setLoading(true);
    try {
      const res = await api.getUpcoming(pageNum, 24);
      setResults(res.data || []);
      setHasNextPage(res.pagination?.has_next_page || false);
      setTotalPages(res.pagination?.last_visible_page || 1);
    } catch (error) {
      console.error("Fetch season failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchSeason(newPage);
  };

  if (loading) {
    return <AnimeGridSkeleton count={24} title="Upcoming Season" compact />;
  }

  return (
    <div className="space-y-8 mt-10">
      {results.length > 0 ? (
        <>
          <AnimeGrid
            anime={results}
            title="Upcoming Season"
            compact
            hideDuration
            upcoming
          />

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
          <p className="text-muted-foreground">No anime found</p>
        </div>
      )}
    </div>
  );
}
