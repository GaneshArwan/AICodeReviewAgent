"use client";

import { usePullRequests } from "@/hooks/usePullRequests";
import { 
  GitPullRequest, 
  ArrowLeft, 
  Loader2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Search, 
  ChevronsLeft, 
  ChevronsRight, 
  Calendar,
  SortAsc,
  SortDesc,
  Filter,
  Check
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PrListProps {
  owner: string;
  repo: string;
  onSelectPr: (prNumber: number) => void;
  onBack: () => void;
}

type SortField = 'created' | 'updated' | 'comments' | 'reactions' | 'relevance';
type SortOrder = 'asc' | 'desc';

interface SortCriteria {
  value: SortField;
  label: string;
}

const SORT_CRITERIA: SortCriteria[] = [
  { value: 'created', label: 'Date' },
  { value: 'updated', label: 'Activity' },
  { value: 'comments', label: 'Comments' },
  { value: 'reactions', label: 'Reactions' },
  { value: 'relevance', label: 'Best Match' },
];

export function PrList({ owner, repo, onSelectPr, onBack }: PrListProps) {
  const {
    prs, loading, refreshing, error,
    appliedPage, sortField, sortOrder,
    searchDraft, setSearchDraft,
    startDraft, setStartDraft,
    endDraft, setEndDraft,
    totalPages, totalCount,
    pageInput, setPageInput,
    handleApplyFilters, handlePageChange,
    handleSortFieldChange, handleSortOrderToggle
  } = usePullRequests(owner, repo);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = parseInt(pageInput, 10);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      handlePageChange(targetPage);
    } else {
      setPageInput(appliedPage.toString());
    }
  };

  const currentSortLabel = SORT_CRITERIA.find(c => c.value === sortField)?.label;

  return (
    <Card className="w-full shadow-2xl border-white/10 glass overflow-hidden flex flex-col h-[850px]">
      <CardHeader className="space-y-3 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-emerald-500 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Change Repo
          </Button>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleApplyFilters}
              disabled={loading || refreshing}
              className={`p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-emerald-500 transition-all ${refreshing ? 'animate-spin text-emerald-500' : ''}`}
              title="Sync & Apply Filters"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Badge variant="secondary" className="font-mono text-[10px] bg-zinc-800/50 text-zinc-300">
              {owner}/{repo}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-emerald-500" />
              Active Pull Requests
            </CardTitle>
            <CardDescription className="text-xs">
              Configure filters and click the sync icon to fetch matching pull requests.
            </CardDescription>
          </div>
          {!loading && totalCount > 0 && (
            <div className="flex flex-col items-end gap-1">
               <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-md border border-white/5">
                Total Results: {totalCount}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-emerald-500/50" />
              <Input 
                placeholder="Search title or author..."
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                className="h-10 pl-9 bg-white/5 dark:bg-zinc-950/40 border-white/5 dark:border-white/5 focus:ring-emerald-500/20 transition-all rounded-xl text-zinc-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-emerald-500/50" />
                <Input 
                  type="date"
                  value={startDraft}
                  onChange={(e) => setStartDraft(e.target.value)}
                  className="h-10 pl-9 bg-white/5 dark:bg-zinc-950/40 border-white/5 dark:border-white/5 focus:ring-emerald-500/20 transition-all rounded-xl text-zinc-200 text-[10px] [color-scheme:dark]"
                  title="Start Date"
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-emerald-500/50" />
                <Input 
                  type="date"
                  value={endDraft}
                  onChange={(e) => setEndDraft(e.target.value)}
                  className="h-10 pl-9 bg-white/5 dark:bg-zinc-950/40 border-white/5 dark:border-white/5 focus:ring-emerald-500/20 transition-all rounded-xl text-zinc-200 text-[10px] [color-scheme:dark]"
                  title="End Date"
                />
              </div>
            </div>
          </div>

          {/* Unified Sorting Control */}
          <div className="flex items-center justify-start pt-1">
            <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-950/50 overflow-hidden min-w-[200px] hover:border-emerald-500/30 transition-all">
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none flex-1">
                  <div className="h-10 flex items-center gap-2 px-4 hover:bg-emerald-500/5 transition-colors cursor-pointer border-r border-zinc-800/50">
                    <Filter className="w-3.5 h-3.5 text-emerald-500/70" />
                    <span className="text-[11px] font-bold text-zinc-300">
                      Sort: {currentSortLabel}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass border-emerald-500/20 rounded-xl w-56 p-2">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-2 py-1.5">
                      Sorting Criteria
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5 mx-1" />
                    {SORT_CRITERIA.map((criteria) => (
                      <DropdownMenuItem 
                        key={criteria.value}
                        onClick={() => handleSortFieldChange(criteria.value)}
                        className="rounded-lg focus:bg-emerald-500/10 focus:text-emerald-400 transition-colors cursor-pointer py-2.5 px-3"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-semibold ${sortField === criteria.value ? 'text-emerald-400' : 'text-zinc-300'}`}>
                            {criteria.label}
                          </span>
                          {sortField === criteria.value && (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={handleSortOrderToggle}
                className="h-10 px-4 hover:bg-emerald-500/10 transition-colors group flex items-center justify-center bg-zinc-900/20"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                ) : (
                  <SortDesc className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-2 pb-4 flex-1 overflow-y-auto flex flex-col">
        {loading && !refreshing ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 space-y-3">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            <p className="text-sm text-zinc-500 italic">Syncing with GitHub...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-destructive bg-destructive/5 rounded-lg mx-2 border border-destructive/10">
            {error}
          </div>
        ) : (
          <div className="space-y-1 flex-1">
            {prs.map(pr => (
              <div 
                key={pr.number} 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-500/5 border border-transparent hover:border-emerald-500/10 transition-all group cursor-pointer"
                onClick={() => onSelectPr(pr.number)}
              >
                <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm font-bold text-emerald-500 shrink-0">#{pr.number}</span>
                    <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-emerald-400 transition-colors">
                      {pr.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      by <span className="text-zinc-300 font-semibold">{pr.author}</span>
                    </span>
                    <span className="opacity-30">•</span>
                    <span>{pr.time}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            
            {prs.length === 0 && (
              <div className="py-20 text-center text-sm text-zinc-500 italic border-2 border-dashed border-zinc-800/50 rounded-2xl mx-2">
                No pull requests found. Adjust filters and click sync.
              </div>
            )}
          </div>
        )}

        {/* Advanced Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2 pt-4 border-t border-white/5 shrink-0">
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
              Page {appliedPage} / {totalPages}
            </span>
            
            <div className="flex items-center gap-2">
              <form onSubmit={handlePageSubmit} className="flex items-center gap-2 mr-2">
                <Input 
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="h-8 w-12 text-center px-1 py-0 text-xs bg-zinc-900/50 border-zinc-800 focus:ring-emerald-500/20 rounded-md text-zinc-200 outline-none"
                />
                <Button type="submit" variant="ghost" size="sm" className="h-8 px-2 text-xs text-zinc-400 hover:text-emerald-400">
                  Jump
                </Button>
              </form>

              <div className="flex gap-1 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={appliedPage === 1 || loading}
                  onClick={() => handlePageChange(1)}
                  className="h-7 w-7 p-0 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={appliedPage === 1 || loading}
                  onClick={() => handlePageChange(appliedPage - 1)}
                  className="h-7 w-7 p-0 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={appliedPage === totalPages || loading}
                  onClick={() => handlePageChange(appliedPage + 1)}
                  className="h-7 w-7 p-0 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={appliedPage === totalPages || loading}
                  onClick={() => handlePageChange(totalPages)}
                  className="h-7 w-7 p-0 rounded-md text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
