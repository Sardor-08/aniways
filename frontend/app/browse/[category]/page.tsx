"use client";

import { useEffect, useState, use } from "react";
import { api, type Anime } from "@/lib/api";
import { AnimeGrid, AnimeGridSkeleton } from "@/components/anime-grid";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const categoryConfig: Record<
  string,
  { title: string; status?: string; order_by: string; sort: string }
> = {
  "new-releases": {
    title: "New Releases",
    status: "airing",
    order_by: "start_date",
    sort: "desc",
  },
  popular: {
    title: "Most Popular",
    order_by: "popularity",
    sort: "asc", // Lower popularity number = more popular
  },
  "top-rated": {
    title: "Top Rated",
    order_by: "score",
    sort: "desc",
  },
};

const validCategories = Object.keys(categoryConfig);

interface BrowsePageProps {
  params: Promise<{ category: string }>;
}

export default function BrowsePage({ params }: BrowsePageProps) {
  const { category } = use(params);
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const isValidCategory = validCategories.includes(category.toLowerCase());
  const config = categoryConfig[category.toLowerCase()];
  const title = config?.title || "Browse";

  useEffect(() => {
    if (isValidCategory) {
      fetchBrowse(1);
    } else {
      setLoading(false);
    }
  }, [category]);

  async function fetchBrowse(pageNum: number) {
    setLoading(true);
    try {
      const res = await api.browseAnime({
        status: config?.status,
        order_by: config?.order_by,
        sort: config?.sort,
        page: pageNum,
        limit: 24,
      });
      setResults(res.data || []);
      setHasNextPage(res.pagination?.has_next_page || false);
      setTotalPages(res.pagination?.last_visible_page || 1);
    } catch (error) {
      console.error("Browse fetch failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchBrowse(newPage);
  };

  if (!isValidCategory) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          Invalid browse category: &quot;{category}&quot;
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Valid categories: {validCategories.join(", ")}
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
          <p className="text-muted-foreground">No anime found</p>
        </div>
      )}
    </div>
  );
}
