"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Key, Box, ChevronDown } from "lucide-react";
import { LLMProvider } from "@/lib/agent/graph";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LLMSettingsProps {
  provider: LLMProvider | "";
  apiKey: string;
  modelName: string;
  onProviderChange: (provider: LLMProvider | "") => void;
  onApiKeyChange: (key: string) => void;
  onModelChange: (model: string) => void;
}

export function LLMSettings({ provider, apiKey, modelName, onProviderChange, onApiKeyChange, onModelChange }: LLMSettingsProps) {
  return (
    <Card className="w-full mt-4 glass-emerald shadow-xl border-emerald-500/10 overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-emerald-400/50">
          LLM Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="provider" className="text-sm font-medium text-zinc-400 ml-1">Provider</Label>
          <Select 
            value={provider} 
            onValueChange={(val) => {
              onProviderChange(val as LLMProvider);
              onModelChange("");
              onApiKeyChange("");
            }}
          >
            <SelectTrigger id="provider" className="w-full h-11 bg-white/5 dark:bg-zinc-950/40 border-white/5 dark:border-white/5 hover:border-emerald-500/30 transition-colors focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-zinc-200">
              <SelectValue placeholder="Select an LLM Provider" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="gemini">Google Gemini</SelectItem>
              <SelectItem value="local">Local API (Ollama / Llama.cpp)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Progressive Disclosure */}
        {provider && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col gap-2">
              <Label htmlFor="modelName" className="text-sm font-medium text-zinc-400 ml-1">Model Name</Label>
              <div className="relative">
                <Box className="absolute left-3 top-3.5 w-4 h-4 text-emerald-500/50" />
                <Input 
                  id="modelName"
                  placeholder={provider === 'openai' ? 'gpt-4o' : provider === 'anthropic' ? 'claude-3-opus-20240229' : 'model-name'}
                  value={modelName}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full h-11 pl-9 bg-white/5 dark:bg-zinc-950/40 border-white/5 dark:border-white/5 focus:ring-emerald-500/20 transition-all rounded-xl text-zinc-200"
                />
              </div>
            </div>

            {provider !== "local" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="apiKey" className="text-sm font-medium text-zinc-400 ml-1">API Key</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-4 h-4 text-emerald-500/50" />
                  <Input 
                    id="apiKey"
                    type="password"
                    placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : provider === 'gemini' ? 'Gemini' : 'Anthropic'} API Key`}
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    className="w-full h-11 pl-9 pr-10 bg-white/5 dark:bg-zinc-950/40 border-white/5 dark:border-white/5 focus:ring-emerald-500/20 transition-all rounded-xl text-zinc-200"
                  />
                  <div className={`absolute right-3 top-4 w-2 h-2 rounded-full transition-all duration-500 ${
                    apiKey 
                      ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" 
                      : "bg-zinc-700 shadow-none"
                  }`} />
                </div>
              </div>
            )}
            
            {provider === "local" && (
              <div className="text-xs text-zinc-500 bg-black/20 p-3 rounded-lg border border-white/5">
                API Key is not required for Local API. Requests will be routed to the configured LOCAL_LLM_URL.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

