"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, List } from "lucide-react";
import { AIEstimateGenerator } from "@/components/estimates/AIEstimateGenerator";
import { cn } from "@/lib/utils";

export default function ProjectEstimatePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  // For demo, we'll use a placeholder project type
  // In production, this would be fetched from the API
  const projectType = "BATHROOM_REMODEL";

  const handleEstimateGenerated = (estimateId: string) => {
    // Could navigate to the estimate detail or stay on page
    console.log("Estimate generated:", estimateId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/projects/${projectId}`}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Estimate</h1>
          <p className="text-sm text-gray-500">
            Generate an estimate using AI or build one manually
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("ai")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            mode === "ai"
              ? "bg-primary text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Sparkles className="h-4 w-4" />
          AI Generator
        </button>
        <button
          onClick={() => setMode("manual")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            mode === "manual"
              ? "bg-primary text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          <List className="h-4 w-4" />
          Manual Entry
        </button>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {mode === "ai" ? (
          <AIEstimateGenerator
            projectId={projectId}
            projectType={projectType}
            onEstimateGenerated={handleEstimateGenerated}
          />
        ) : (
          <div className="space-y-6">
            <div className="text-center py-12">
              <List className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Manual Estimate Builder</h3>
              <p className="mt-2 text-gray-500">
                Add line items manually to build your estimate
              </p>
              <p className="mt-4 text-sm text-gray-400">
                Coming soon - use AI Generator for now
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
