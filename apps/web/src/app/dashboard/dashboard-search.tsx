"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";

interface CountsObj {
  all: number;
  pdf: number;
  pptx: number;
  docx: number;
  youtube: number;
  audio: number;
  web: number;
}

interface DashboardSearchProps {
  currentQuery: string;
  currentType: string;
  counts: CountsObj;
}

export function DashboardSearch({ currentQuery, currentType, counts }: DashboardSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(currentQuery);

  const updateFilters = useCallback(
    (newQuery: string, newType: string) => {
      const params = new URLSearchParams();
      if (newQuery) params.set("q", newQuery);
      if (newType && newType !== "all") params.set("type", newType);

      const queryString = params.toString();
      router.push(`/dashboard${queryString ? `?${queryString}` : ""}`);
    },
    [router]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters(query, currentType);
  };

  const clearSearch = () => {
    setQuery("");
    updateFilters("", currentType);
  };

  const filters = [
    { key: "all", label: "All", count: counts.all },
    { key: "pdf", label: "PDF", count: counts.pdf },
    { key: "pptx", label: "PPTX", count: counts.pptx },
    { key: "docx", label: "DOCX", count: counts.docx },
    { key: "youtube", label: "YouTube", count: counts.youtube },
    { key: "audio", label: "Audio/Video", count: counts.audio },
    { key: "web", label: "Website", count: counts.web },
  ];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your sources..." className="pl-10 pr-10" />
          {query && (
            <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="flex gap-2 flex-wrap">
        {filters.map((filter) => (
          <button key={filter.key} onClick={() => updateFilters(query, filter.key)} disabled={filter.count === 0 && filter.key !== "all"}>
            <Badge variant={currentType === filter.key ? "default" : "outline"} className={`cursor-pointer transition-colors ${filter.count === 0 && filter.key !== "all" ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10"}`}>
              {filter.label} ({filter.count})
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
