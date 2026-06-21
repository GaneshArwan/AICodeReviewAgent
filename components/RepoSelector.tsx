"use client";

import { useState } from "react";
import { Search, GitBranch, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RepoSelectorProps {
  onSelectRepo: (owner: string, repo: string) => void;
}

export function RepoSelector({ onSelectRepo }: RepoSelectorProps) {
  const [repoInput, setRepoInput] = useState("");

  const handleSelect = () => {
    const cleanInput = repoInput.trim();
    
    // Handle full GitHub URLs
    if (cleanInput.includes("github.com/")) {
      const urlParts = cleanInput.split("github.com/")[1].split("/");
      if (urlParts.length >= 2) {
        onSelectRepo(urlParts[0], urlParts[1]);
        return;
      }
    }

    // Handle standard owner/repo format
    const parts = cleanInput.split("/");
    if (parts.length === 2 && parts[0] && parts[1]) {
      onSelectRepo(parts[0].trim(), parts[1].trim());
    } else {
      alert("Invalid format. Please use 'owner/repo' or a full GitHub URL.");
    }
  };

  return (
    <Card className="w-full shadow-2xl border-white/10 glass">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <GitBranch className="h-5 w-5 text-emerald-500" />
          </div>
          <CardTitle className="text-lg">Source Repository</CardTitle>
        </div>
        <CardDescription>
          Connect to a public or private GitHub repository to begin the automated agent review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9 h-11 transition-all focus:ring-2 focus:ring-emerald-500/20 bg-background/50 backdrop-blur-sm"
            placeholder="e.g., facebook/react"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect()}
          />
        </div>
        <Button className="w-full h-11 gap-2 text-sm font-semibold glossy-emerald" onClick={handleSelect}>
          Initialize Repository Scan
        </Button>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/50 p-2 rounded border">
          <Info className="h-3 w-3" />
          <span>Format: owner/repository_name (e.g., your_username/your_project)</span>
        </div>
      </CardContent>
    </Card>
  );
}
