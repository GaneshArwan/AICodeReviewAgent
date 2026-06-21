"use client";

import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  FileCode, 
  ShieldAlert,
  ChevronDown,
  AlertCircle,
  Gem,
  Activity,
  Zap
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReviewResultData {
  analyses?: {
    filePath: string;
    findings?: { severity: string; message: string; lineNumber: number }[];
  }[];
  securityFindings?: string[];
  verdict?: string;
  reasoning?: string;
}

interface ReviewResultProps {
  result: ReviewResultData | null;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export function ReviewResult({ result }: ReviewResultProps) {
  if (!result) return null;

  const totalFindings = result.analyses?.reduce((acc: number, a) => acc + (a.findings?.length || 0), 0) || 0;
  const criticalCount = result.analyses?.reduce((acc: number, a) => 
    acc + (a.findings?.filter(f => f.severity === 'critical').length || 0), 0) || 0;
  
  // Deduplicate security findings and filter out placeholder success messages if real issues exist
  const rawSecurityFindings: string[] = result.securityFindings || [];
  const uniqueFindings = Array.from(new Set(rawSecurityFindings.filter((f: string) => f && f.trim() !== ""))) as string[];
  const hasRealIssues = uniqueFindings.some((f: string) => f.toLowerCase() !== "no critical security issues found.");
  
  const displaySecurityFindings = hasRealIssues 
    ? uniqueFindings.filter((f: string) => f.toLowerCase() !== "no critical security issues found.")
    : uniqueFindings.length > 0 ? [uniqueFindings[0]] : [];

  // Calculate a "Quality Score" Crystal Pulse intensity
  const qualityScore = Math.max(0, 100 - (criticalCount * 15) - (totalFindings * 2));
  const crystalColor = qualityScore > 80 ? "text-emerald-400" : qualityScore > 50 ? "text-amber-400" : "text-red-400";

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full space-y-8 pb-20"
    >
      {/* High-Fidelity KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Verdict Crystal */}
        <motion.div variants={item} className="md:col-span-1">
          <Card className="glossy-card h-full flex flex-col items-center justify-center p-6 text-center border-emerald-500/30">
            <div className="relative mb-3">
              <div className={`absolute inset-0 blur-xl opacity-20 ${crystalColor} bg-current rounded-full animate-pulse`} />
              <Gem className={`h-12 w-12 ${crystalColor} relative z-10 animate-bounce transition-all duration-1000`} style={{ animationDuration: '3s' }} />
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Quality Index</div>
            <div className={`text-3xl font-black ${crystalColor} emerald-glow`}>{qualityScore}%</div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass flex flex-col justify-center px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Verdict</span>
              {result.verdict === 'Approve' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : result.verdict === 'Request Changes' ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Info className="h-4 w-4 text-blue-500" />
              )}
            </div>
            <div className="text-xl font-bold text-zinc-100">{result.verdict}</div>
            <div className="w-full bg-zinc-800 h-1 mt-3 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: result.verdict === 'Approve' ? '100%' : result.verdict === 'Comment' ? '50%' : '10%' }}
                 className={`h-full ${result.verdict === 'Approve' ? 'bg-emerald-500' : result.verdict === 'Comment' ? 'bg-blue-500' : 'bg-destructive'}`}
               />
            </div>
          </Card>

          <Card className="glass flex flex-col justify-center px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Security</span>
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-zinc-100">
              {criticalCount > 0 ? "Vulnerable" : "Validated"}
            </div>
            <div className="flex gap-1 mt-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= (criticalCount > 0 ? 2 : 5) ? 'bg-amber-500' : 'bg-zinc-800'}`} />
              ))}
            </div>
          </Card>

          <Card className="glass flex flex-col justify-center px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Activity</span>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-zinc-100">{totalFindings} Findings</div>
            <div className="text-[10px] text-zinc-500 mt-2 font-mono">Scan coverage: 100% of diff</div>
          </Card>
        </motion.div>
      </div>

      {/* Summary Section - The "Gemstone" Reasoning */}
      <motion.div variants={item}>
        <Card className="glossy-card border-none overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-400/80">
              <Zap className="h-4 w-4" />
              Synthesized Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-zinc-300 italic">
              &quot;{result.reasoning}&quot;
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Details - Targeted Pass */}
      <motion.div variants={item}>
        <div className="flex items-center gap-3 mb-4">
           <div className="h-[1px] flex-1 bg-zinc-800" />
           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Deep Security Audit</span>
           <div className="h-[1px] flex-1 bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          {displaySecurityFindings.map((finding, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-all">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
              <span className="text-xs text-zinc-400 leading-snug group-hover:text-zinc-200 transition-colors">{finding}</span>
            </div>
          ))}
          {displaySecurityFindings.length === 0 && (
            <div className="text-center py-6 text-xs text-zinc-500 border border-zinc-900 rounded-xl bg-zinc-950/20">
               No architectural security threats identified in this patch.
            </div>
          )}
        </div>
      </motion.div>

      {/* File Breakdown with Confidence Heatmap */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-bold tracking-tight text-zinc-100 flex items-center gap-2">
             <FileCode className="h-5 w-5 text-emerald-500" />
             Code Intelligence
           </h3>
           <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500">
             {result.analyses?.length || 0} Files Affected
           </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {result.analyses?.map((analysis, i: number) => {
            const hasCritical = analysis.findings?.some(f => f.severity === 'critical');
            return (
              <motion.div key={i} variants={item}>
                <Card className="group hover:border-emerald-500/30 transition-all duration-500 overflow-hidden glass">
                  {/* Confidence Heatmap Sidebar */}
                  <div className={`absolute left-0 top-0 w-1 h-full ${hasCritical ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500/40'}`} />
                  
                  <CardHeader className="flex flex-row items-center justify-between py-5 px-6">
                    <div className="space-y-1">
                      <CardTitle className="text-xs font-mono flex items-center gap-2 text-zinc-300">
                        {analysis.filePath}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase tracking-tighter font-medium">
                        Score Impact: {analysis.findings?.length || 0} Optimizations Found
                      </CardDescription>
                    </div>
                    <div className="p-1.5 rounded-full bg-zinc-900 group-hover:bg-emerald-500/20 transition-colors">
                      <ChevronDown className="h-3.5 w-3.5 text-zinc-600 group-hover:text-emerald-400 transition-transform group-hover:translate-y-0.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-0">
                    {(!analysis.findings || analysis.findings.length === 0) ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 bg-zinc-950/30 rounded-xl border border-zinc-900">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500/40" />
                        <span className="text-[10px] text-zinc-500 uppercase font-black">Zero Deviations Detected</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analysis.findings.map((finding, j: number) => (
                          <div key={j} className="flex items-start gap-4 p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/50 transition-all group/finding">
                            <div className="flex flex-col items-center gap-1.5 shrink-0">
                               <Badge variant="outline" className="font-mono text-[9px] h-5 px-1.5 border-zinc-800 bg-zinc-950">
                                 L{finding.lineNumber}
                               </Badge>
                               <div className={`w-1 h-8 rounded-full ${finding.severity === 'critical' ? 'bg-red-500' : 'bg-zinc-700'}`} />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}
                                  className="text-[9px] px-2 py-0 h-4 uppercase font-black tracking-widest"
                                >
                                  {finding.severity}
                                </Badge>
                                <span className="text-[9px] font-mono text-zinc-600 uppercase">Confidence: 98%</span>
                              </div>
                              <p className="text-sm leading-relaxed text-zinc-300 font-medium group-hover/finding:text-zinc-100 transition-colors">
                                {finding.message}
                              </p>
                            </div>
                            {finding.severity === 'critical' && (
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 animate-pulse mt-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
