import { useState, useEffect, useCallback } from "react";

export type SortField = 'created' | 'updated' | 'comments' | 'reactions' | 'relevance';
export type SortOrder = 'asc' | 'desc';

export interface PrData {
  number: number;
  title: string;
  author: string;
  time: string;
  [key: string]: any;
}

export function usePullRequests(owner: string, repo: string) {
  const [prs, setPrs] = useState<PrData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Applied State
  const [appliedPage, setAppliedPage] = useState(1);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Input State (Drafts)
  const [searchDraft, setSearchDraft] = useState("");
  const [startDraft, setStartDraft] = useState("");
  const [endDraft, setEndDraft] = useState("");
  
  // UI helper state
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInput, setPageInput] = useState("1");

  const fetchPrs = useCallback(async (
    pageNum: number, 
    search: string, 
    start: string, 
    end: string, 
    sort: SortField, 
    order: SortOrder,
    isRefresh = false
  ) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const url = `/api/prs?owner=${owner}&repo=${repo}&page=${pageNum}&search=${encodeURIComponent(search)}&startDate=${start}&endDate=${end}&sort=${sort}&order=${order}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setPrs(data.prs || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      setAppliedPage(pageNum);
      setPageInput(pageNum.toString());
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [owner, repo]);

  const handleApplyFilters = () => {
    setAppliedSearch(searchDraft);
    setAppliedStart(startDraft);
    setAppliedEnd(endDraft);
    fetchPrs(1, searchDraft, startDraft, endDraft, sortField, sortOrder, true);
  };

  const handlePageChange = (newPage: number) => {
    fetchPrs(newPage, appliedSearch, appliedStart, appliedEnd, sortField, sortOrder);
  };

  const handleSortFieldChange = (newField: SortField) => {
    setSortField(newField);
    fetchPrs(1, appliedSearch, appliedStart, appliedEnd, newField, sortOrder);
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    fetchPrs(1, appliedSearch, appliedStart, appliedEnd, sortField, newOrder);
  };

  useEffect(() => {
    fetchPrs(1, "", "", "", 'created', 'desc');
  }, [owner, repo, fetchPrs]);

  return {
    prs, loading, refreshing, error,
    appliedPage, sortField, sortOrder,
    searchDraft, setSearchDraft,
    startDraft, setStartDraft,
    endDraft, setEndDraft,
    totalPages, totalCount,
    pageInput, setPageInput,
    handleApplyFilters, handlePageChange,
    handleSortFieldChange, handleSortOrderToggle
  };
}
