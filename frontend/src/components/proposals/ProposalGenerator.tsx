"use client";

import { useState } from "react";
import {
  Sparkles,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface Estimate {
  id: string;
  name: string;
  totalCost: number;
  materialCost: number;
  laborCost: number;
  status: string;
  createdAt: string;
}

interface ProposalGeneratorProps {
  projectId: string;
  estimates: Estimate[];
  onProposalGenerated: (proposalId: string) => void;
}

type Tone = "professional" | "friendly" | "premium" | "value";

const toneOptions: { value: Tone; label: string; description: string }[] = [
  {
    value: "professional",
    label: "Professional",
    description: "Formal, business-like, emphasizes credentials",
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm, conversational, relationship-focused",
  },
  {
    value: "premium",
    label: "Premium",
    description: "Luxurious, exclusive, emphasizes quality",
  },
  {
    value: "value",
    label: "Value",
    description: "Practical, ROI-focused, emphasizes savings",
  },
];

export function ProposalGenerator({
  projectId,
  estimates,
  onProposalGenerated,
}: ProposalGeneratorProps) {
  const [selectedEstimate, setSelectedEstimate] = useState<string>("");
  const [tone, setTone] = useState<Tone>("professional");
  const [targetMargin, setTargetMargin] = useState(20);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedProposal, setGeneratedProposal] = useState<any>(null);

  const handleGenerate = async () => {
    if (!selectedEstimate) {
      setError("Please select an estimate");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/proposals/ai-generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            estimateId: selectedEstimate,
            tone,
            targetMargin,
            customInstructions: customInstructions || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate proposal");
      }

      const data = await response.json();
      setGeneratedProposal(data.data);
      onProposalGenerated(data.data.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedEstimateData = estimates.find((e) => e.id === selectedEstimate);

  if (generatedProposal) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 p-4">
          <div className="flex items-center gap-3">
            <Check className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">
                Proposal Generated Successfully!
              </h3>
              <p className="text-sm text-green-700">
                Your Good-Better-Best proposal is ready for review.
              </p>
            </div>
          </div>
        </div>

        {/* Proposal Preview */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {generatedProposal.title}
          </h3>
          <p className="mt-2 text-gray-600">{generatedProposal.introduction}</p>

          {/* Tier Preview */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {/* Good Tier */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900">
                {generatedProposal.goodTierName}
              </h4>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(generatedProposal.goodTierPrice)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {generatedProposal.goodTierDescription}
              </p>
            </div>

            {/* Better Tier */}
            <div className="relative rounded-lg border-2 border-primary bg-primary/5 p-4">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-white">
                MOST POPULAR
              </span>
              <h4 className="font-medium text-gray-900">
                {generatedProposal.betterTierName}
              </h4>
              <p className="mt-1 text-2xl font-bold text-primary">
                {formatCurrency(generatedProposal.betterTierPrice)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {generatedProposal.betterTierDescription}
              </p>
            </div>

            {/* Best Tier */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900">
                {generatedProposal.bestTierName}
              </h4>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(generatedProposal.bestTierPrice)}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                {generatedProposal.bestTierDescription}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <a
              href={`/projects/${projectId}/proposals/${generatedProposal.id}`}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              View Full Proposal
              <ChevronRight className="h-4 w-4" />
            </a>
            <button
              onClick={() => setGeneratedProposal(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Generate Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">AI Proposal Generator</h2>
          <p className="text-sm text-gray-500">
            Create a compelling Good-Better-Best proposal from your estimate
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Estimate Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Select Estimate
        </label>
        {estimates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <FileText className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              No estimates available. Create an estimate first.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {estimates.map((estimate) => (
              <button
                key={estimate.id}
                onClick={() => setSelectedEstimate(estimate.id)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                  selectedEstimate === estimate.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border",
                    selectedEstimate === estimate.id
                      ? "border-primary bg-primary"
                      : "border-gray-300"
                  )}
                >
                  {selectedEstimate === estimate.id && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {estimate.name || `Estimate v${estimate.id.slice(-4)}`}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-primary">
                    {formatCurrency(estimate.totalCost)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Materials: {formatCurrency(estimate.materialCost)} | Labor:{" "}
                    {formatCurrency(estimate.laborCost)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tone Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Proposal Tone
        </label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {toneOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTone(option.value)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                tone === option.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="mt-1 text-xs text-gray-500">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Target Margin */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Target Profit Margin: {targetMargin}%
        </label>
        <input
          type="range"
          min="5"
          max="50"
          value={targetMargin}
          onChange={(e) => setTargetMargin(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>5%</span>
          <span>50%</span>
        </div>
        {selectedEstimateData && (
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Estimate Base:</span>
              <span className="font-medium">
                {formatCurrency(selectedEstimateData.totalCost)}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-gray-600">With {targetMargin}% margin:</span>
              <span className="font-semibold text-primary">
                {formatCurrency(
                  selectedEstimateData.totalCost * (1 + targetMargin / 100)
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Custom Instructions */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Custom Instructions (Optional)
        </label>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="Add any specific instructions for the AI, such as emphasizing certain features, mentioning specific warranties, or targeting particular client concerns..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !selectedEstimate}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors",
          isGenerating || !selectedEstimate
            ? "cursor-not-allowed bg-gray-100 text-gray-400"
            : "bg-primary text-white hover:bg-primary/90"
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Proposal...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate Good-Better-Best Proposal
          </>
        )}
      </button>
    </div>
  );
}
