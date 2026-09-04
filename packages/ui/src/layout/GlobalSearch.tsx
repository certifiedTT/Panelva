import React, { useState } from "react";
import { Search, X, BookOpen, User, Building2, MessageSquare } from "lucide-react";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  badge?: string;
}

export interface GroupedSearchResults {
  series?: SearchResultItem[];
  creators?: SearchResultItem[];
  studios?: SearchResultItem[];
  posts?: SearchResultItem[];
}

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  results: GroupedSearchResults;
  query: string;
  onQueryChange: (query: string) => void;
  onSelectItem: (type: "series" | "creators" | "studios" | "posts", item: SearchResultItem) => void;
  isLoading?: boolean;
}

export function GlobalSearch({
  isOpen,
  onClose,
  results,
  query,
  onQueryChange,
  onSelectItem,
  isLoading = false,
}: GlobalSearchProps) {
  if (!isOpen) return null;

  const totalResults =
    (results.series?.length || 0) +
    (results.creators?.length || 0) +
    (results.studios?.length || 0) +
    (results.posts?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 p-4 pt-16 backdrop-blur-sm sm:pt-24">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-slate-800 px-4 py-3.5">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search series, creators, studios, posts..."
            autoFocus
            className="flex-1 bg-transparent px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query.length > 0 && (
            <button
              onClick={() => onQueryChange("")}
              className="rounded p-1 text-slate-400 hover:text-slate-200 mr-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700"
          >
            Esc
          </button>
        </div>

        {/* Results Body: Strictly Grouped by Category */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {isLoading && (
            <div className="py-8 text-center text-sm text-slate-400">Searching...</div>
          )}

          {!isLoading && query.trim() !== "" && totalResults === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!isLoading && query.trim() === "" && (
            <div className="py-8 text-center text-xs text-slate-500">
              Type keywords to search across comics, novels, creators, and community posts.
            </div>
          )}

          {/* 1. Series Section */}
          {results.series && results.series.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Series ({results.series.length})</span>
              </div>
              <div className="space-y-1">
                {results.series.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem("series", item)}
                    className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-slate-800/70"
                  >
                    <div className="flex items-center space-x-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-10 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-8 items-center justify-center rounded bg-slate-800 text-xs text-slate-400">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-slate-400">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                    {item.badge && (
                      <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-semibold text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 2. Creators Section */}
          {results.creators && results.creators.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
                <User className="h-3.5 w-3.5" />
                <span>Creators ({results.creators.length})</span>
              </div>
              <div className="space-y-1">
                {results.creators.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem("creators", item)}
                    className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-slate-800/70"
                  >
                    <div className="flex items-center space-x-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900/50 text-xs text-blue-300">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-slate-400">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 3. Studios Section */}
          {results.studios && results.studios.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Building2 className="h-3.5 w-3.5" />
                <span>Studios ({results.studios.length})</span>
              </div>
              <div className="space-y-1">
                {results.studios.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem("studios", item)}
                    className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-slate-800/70"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900/50 text-xs text-emerald-300">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-slate-400">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 4. Posts Section */}
          {results.posts && results.posts.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Posts ({results.posts.length})</span>
              </div>
              <div className="space-y-1">
                {results.posts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem("posts", item)}
                    className="flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-slate-800/70"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-900/50 text-xs text-amber-300">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-slate-400">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
