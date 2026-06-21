"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, LogOut, ChevronRight, PanelLeftClose, PanelLeftOpen, ChevronDown, CheckCircle2, AlertCircle, MessageSquare, ShieldAlert } from "lucide-react";
import { useSession, signOut, signIn } from "next-auth/react";
import { useState } from "react";
import { RepoSelector } from "@/components/RepoSelector";
import { PrList } from "@/components/PrList";
import { ReviewResult } from "@/components/ReviewResult";
import { LLMSettings } from "@/components/LLMSettings";
import { LLMProvider } from "@/lib/agent/graph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type ReviewHistory = {
  prNumber: number;
  verdict: string;
  result: Record<string, unknown>;
};

type WorkspaceRepo = {
  owner: string;
  name: string;
  history: ReviewHistory[];
  isOpen: boolean;
};

export default function Home() {
  const { data: session } = useSession();
  const [workspace, setWorkspace] = useState<WorkspaceRepo[]>([]);
  const [activeRepo, setActiveRepo] = useState<{owner: string, name: string} | null>(null);
  
  const [selectedPr, setSelectedPr] = useState<number | null>(null);
  const [reviewResult, setReviewResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Auth Consent Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [hasAcknowledgedAuth, setHasAcknowledgedAuth] = useState(false);
  
  const [llmProvider, setLlmProvider] = useState<LLMProvider | "">("");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("");

  const handleSelectRepo = (owner: string, name: string) => {
    setActiveRepo({ owner, name });
    setWorkspace(prev => {
      const exists = prev.find(r => r.owner === owner && r.name === name);
      if (!exists) {
        return [{ owner, name, history: [], isOpen: true }, ...prev];
      }
      return prev.map(r => r.owner === owner && r.name === name ? { ...r, isOpen: true } : r);
    });
    setSelectedPr(null);
    setReviewResult(null);
  };

  const handleSelectPr = async (prNumber: number) => {
    if (!llmProvider) {
      alert("Please select a Provider first.");
      return;
    }

    if (llmProvider !== 'local' && !llmApiKey) {
      alert("API Key is required.");
      return;
    }

    if (!llmModel.trim()) {
      alert("Model ID is required.");
      return;
    }

    setSelectedPr(prNumber);
    setLoading(true);
    setReviewResult(null);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: activeRepo?.owner,
          repo: activeRepo?.name,
          prNumber,
          llmProvider,
          llmApiKey,
          llmModel
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(`Analysis Error: ${data.error}`);
      } else {
        setReviewResult(data);
        
        // Add to history
        setWorkspace(prev => prev.map(r => {
          if (r.owner === activeRepo?.owner && r.name === activeRepo?.name) {
            const existingPr = r.history.find(h => h.prNumber === prNumber);
            const newHistory = existingPr
              ? r.history.map(h => h.prNumber === prNumber ? { prNumber, verdict: data.verdict, result: data } : h)
              : [{ prNumber, verdict: data.verdict, result: data }, ...r.history];
            return { ...r, history: newHistory, isOpen: true };
          }
          return r;
        }));
      }
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred. Check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRepoOpen = (owner: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspace(prev => prev.map(r => r.owner === owner && r.name === name ? { ...r, isOpen: !r.isOpen } : r));
  };

  const handleRestoreHistory = (repoOwner: string, repoName: string, historyItem: ReviewHistory) => {
    setActiveRepo({ owner: repoOwner, name: repoName });
    setSelectedPr(historyItem.prNumber);
    setReviewResult(historyItem.result);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#020617] text-zinc-100 overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
      
      {/* Sidebar - Prototypical SaaS Navigation */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-72 border-r border-white/5 flex flex-col fixed inset-y-0 left-0 bg-slate-50 dark:bg-[#020617] z-50 glass"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold tracking-tight text-xl">ReviewAgent</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="text-slate-500 hover:text-emerald-500 transition-all p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>
            
            <Separator className="bg-zinc-800 px-6 mx-auto w-4/5" />

            <div className="flex-1 overflow-y-auto p-4 space-y-6 mt-4">
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 tracking-widest">Global Configuration</span>
                <LLMSettings 
                  provider={llmProvider}
                  apiKey={llmApiKey}
                  modelName={llmModel}
                  onProviderChange={setLlmProvider}
                  onApiKeyChange={setLlmApiKey}
                  onModelChange={setLlmModel}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Active Workspace</span>
                  {workspace.length > 0 && (
                    <button 
                      onClick={() => { setWorkspace([]); setActiveRepo(null); setSelectedPr(null); setReviewResult(null); }} 
                      className="text-[10px] text-red-500/70 hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {workspace.length === 0 ? (
                    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                      <span className="text-xs text-zinc-500 italic">No repository connected</span>
                    </div>
                  ) : (
                    workspace.map((r, i) => {
                      const isActiveRepo = activeRepo?.owner === r.owner && activeRepo?.name === r.name;
                      return (
                        <div key={i} className="flex flex-col gap-1">
                          <button 
                            onClick={() => { setActiveRepo({owner: r.owner, name: r.name}); setSelectedPr(null); setReviewResult(null); }}
                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                              isActiveRepo && !selectedPr
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <GitBranch className={`h-4 w-4 shrink-0 ${isActiveRepo && !selectedPr ? 'text-emerald-500' : 'text-zinc-500'}`} />
                              <span className="text-xs font-mono truncate">{r.owner}/{r.name}</span>
                            </div>
                            <div onClick={(e) => toggleRepoOpen(r.owner, r.name, e)} className="p-1 hover:bg-white/10 rounded ml-2">
                              <ChevronDown className={`h-3 w-3 transition-transform ${r.isOpen ? '' : '-rotate-90'}`} />
                            </div>
                          </button>
                          
                          {/* Render History Sub-items */}
                          {r.isOpen && r.history.length > 0 && (
                            <div className="flex flex-col gap-1 pl-4 mt-1 border-l border-zinc-800 ml-2">
                              {r.history.map((h, j) => {
                                const isHistoryActive = isActiveRepo && selectedPr === h.prNumber;
                                return (
                                  <button
                                    key={j}
                                    onClick={() => handleRestoreHistory(r.owner, r.name, h)}
                                    className={`flex items-center gap-2 p-2 rounded-md transition-all text-left ${
                                      isHistoryActive
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                                    }`}
                                  >
                                    {h.verdict === 'Approve' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : 
                                     h.verdict === 'Request Changes' ? <AlertCircle className="h-3 w-3 text-red-500" /> : 
                                     <MessageSquare className="h-3 w-3 text-blue-500" />}
                                    <span className="text-[10px] font-mono">PR #{h.prNumber}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800">
              {session ? (
                <div className="flex items-center justify-between p-2 bg-zinc-900/50 rounded-lg">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold uppercase">{session.user?.name?.[0]}</span>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-medium truncate">{session.user?.name}</span>
                      <Badge variant="outline" className="text-[8px] h-3 px-1 w-fit border-zinc-700 text-green-500">Connected</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button className="w-full gap-2 h-10 glossy-emerald" onClick={() => setIsAuthModalOpen(true)}>
                  <GitBranch className="h-4 w-4" />
                  Connect GitHub
                </Button>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Stage */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:pl-72' : 'pl-0'}`}>
        <div className="max-w-6xl mx-auto p-4 md:p-10">
          <header className="mb-12 flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-sm bg-white dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-800/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex-shrink-0"
              >
                <PanelLeftOpen size={20} />
              </button>
            )}
            <div className="flex-1 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-zinc-500 text-sm">Professional-grade repository intelligence and automated security auditing.</p>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {!activeRepo ? (
              <motion.section 
                key="selector"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-2xl mx-auto"
              >
                <RepoSelector onSelectRepo={handleSelectRepo} />
              </motion.section>
            ) : loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
              >
                <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <div className="text-center">
                  <h4 className="font-semibold text-lg">Agentic Reasoning in Progress</h4>
                  <p className="text-sm text-zinc-500">Analyzing chunks from PR #{selectedPr} using {llmProvider} engine...</p>
                </div>
              </motion.div>
            ) : reviewResult ? (
              <motion.section 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pb-20"
              >
                <div className="flex items-center gap-2 mb-6 text-sm text-zinc-400">
                  <button onClick={() => { setActiveRepo(null); setSelectedPr(null); }} className="hover:text-zinc-100 transition-colors">Workspace</button>
                  <ChevronRight className="h-4 w-4" />
                  <button onClick={() => { setSelectedPr(null); setReviewResult(null); }} className="hover:text-zinc-100 transition-colors">#{selectedPr}</button>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-zinc-100 font-medium">Review Report</span>
                </div>
                <ReviewResult result={reviewResult} />
              </motion.section>
            ) : !selectedPr ? (
              <motion.section 
                key="prlist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-3xl mx-auto"
              >
                <PrList 
                  key={`${activeRepo.owner}-${activeRepo.name}`}
                  owner={activeRepo.owner} 
                  repo={activeRepo.name} 
                  onSelectPr={handleSelectPr} 
                  onBack={() => { setActiveRepo(null); setSelectedPr(null); }}
                />
              </motion.section>
            ) : (
              <div key="empty" className="h-64 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 italic text-sm">
                No active session. Select a PR to begin.
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* GitHub Auth Consent Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#020617] border border-emerald-500/20 shadow-2xl rounded-2xl p-6 glass-emerald"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <ShieldAlert className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100">GitHub Authentication</h3>
              </div>
              
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                You are about to connect your GitHub account. Please note that <strong className="text-zinc-200">Public Repositories</strong> can be analyzed without logging in. You only need to authorize this application if you intend to analyze <strong className="text-emerald-400">Private Repositories</strong>.
              </p>

              <label className="flex items-start gap-3 cursor-pointer mb-8 group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input 
                    type="checkbox" 
                    className="peer appearance-none w-5 h-5 border-2 border-zinc-600 rounded-md checked:bg-emerald-500 checked:border-emerald-500 transition-all cursor-pointer"
                    checked={hasAcknowledgedAuth}
                    onChange={(e) => setHasAcknowledgedAuth(e.target.checked)}
                  />
                  <CheckCircle2 className="absolute text-white w-3 h-3 opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                  I understand that connecting GitHub is only necessary for private repository access.
                </span>
              </label>

              <div className="flex justify-end gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => { setIsAuthModalOpen(false); setHasAcknowledgedAuth(false); }} 
                  className="hover:bg-white/5 text-zinc-400"
                >
                  Cancel
                </Button>
                <Button 
                  className={`gap-2 transition-all duration-300 ${hasAcknowledgedAuth ? 'glossy-emerald' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed hover:bg-zinc-800'}`}
                  onClick={() => {
                    if (hasAcknowledgedAuth) signIn('github');
                  }}
                >
                  <GitBranch className="h-4 w-4" />
                  Proceed to GitHub
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
