"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PhotoUploader } from "./PhotoUploader";
import { formatCurrency } from "@/lib/formatters";
import { projectTypeLabels } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface AIEstimateGeneratorProps {
  projectId: string;
  projectType: string;
  onEstimateGenerated?: (estimateId: string) => void;
}

interface Measurement {
  name: string;
  value: string;
  unit: string;
}

interface AIWarning {
  severity: "high" | "medium" | "low";
  message: string;
  recommendation: string;
}

interface AIAnalysis {
  summary: {
    scopeDescription: string;
    estimatedDuration: string;
    complexityRating: string;
    confidenceScore: number;
    notes: string[];
  };
  suggestedTiers: {
    good: { description: string; adjustments: string[]; priceMultiplier: number };
    better: { description: string; adjustments: string[]; priceMultiplier: number };
    best: { description: string; adjustments: string[]; priceMultiplier: number };
  };
  warnings: AIWarning[];
  questions: string[];
}

const qualityTiers = [
  { value: "standard", label: "Standard", description: "Builder grade materials" },
  { value: "mid-range", label: "Mid-Range", description: "Quality materials, popular choice" },
  { value: "premium", label: "Premium", description: "High-end materials and finishes" },
];

const commonMeasurements: Record<string, { name: string; unit: string }[]> = {
  KITCHEN_REMODEL: [
    { name: "Room Length", unit: "ft" },
    { name: "Room Width", unit: "ft" },
    { name: "Countertop Linear Feet", unit: "ft" },
    { name: "Number of Cabinets", unit: "count" },
  ],
  BATHROOM_REMODEL: [
    { name: "Room Length", unit: "ft" },
    { name: "Room Width", unit: "ft" },
    { name: "Shower/Tub Area", unit: "sqft" },
    { name: "Vanity Width", unit: "inches" },
  ],
  ROOFING: [
    { name: "Roof Area", unit: "sqft" },
    { name: "Number of Slopes", unit: "count" },
    { name: "Ridge Length", unit: "ft" },
  ],
  FLOORING: [
    { name: "Total Area", unit: "sqft" },
    { name: "Number of Rooms", unit: "count" },
    { name: "Stairs (if any)", unit: "count" },
  ],
  DEFAULT: [
    { name: "Area", unit: "sqft" },
    { name: "Length", unit: "ft" },
    { name: "Width", unit: "ft" },
  ],
};

export function AIEstimateGenerator({
  projectId,
  projectType,
  onEstimateGenerated,
}: AIEstimateGeneratorProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [scopeDescription, setScopeDescription] = useState("");
  const [qualityTier, setQualityTier] = useState<"standard" | "mid-range" | "premium">("mid-range");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    estimate: any;
    aiAnalysis: AIAnalysis;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const suggestedMeasurements = commonMeasurements[projectType] || commonMeasurements.DEFAULT;

  const addMeasurement = () => {
    setMeasurements([...measurements, { name: "", value: "", unit: "ft" }]);
  };

  const updateMeasurement = (index: number, field: keyof Measurement, value: string) => {
    const updated = [...measurements];
    updated[index][field] = value;
    setMeasurements(updated);
  };

  const removeMeasurement = (index: number) => {
    setMeasurements(measurements.filter((_, i) => i !== index));
  };

  const addSuggestedMeasurement = (name: string, unit: string) => {
    if (!measurements.some((m) => m.name === name)) {
      setMeasurements([...measurements, { name, value: "", unit }]);
    }
  };

  const handleGenerate = async () => {
    if (!scopeDescription.trim()) {
      setError("Please provide a scope description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert measurements to the expected format
      const measurementsObj: Record<string, number> = {};
      measurements.forEach((m) => {
        if (m.name && m.value) {
          measurementsObj[`${m.name} (${m.unit})`] = parseFloat(m.value) || 0;
        }
      });

      const response = await fetch(`/api/projects/${projectId}/estimates/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photos,
          measurements: measurementsObj,
          scopeDescription,
          projectType,
          qualityTier,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate estimate");
      }

      setResult({
        estimate: data.data,
        aiAnalysis: data.aiAnalysis,
      });

      if (onEstimateGenerated) {
        onEstimateGenerated(data.data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 border-red-200 text-red-800";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Estimate Generated</h3>
            <p className="text-sm text-green-700">
              AI confidence: {Math.round(result.aiAnalysis.summary.confidenceScore * 100)}%
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="font-semibold text-gray-900">Project Summary</h4>
          <p className="mt-2 text-gray-600">{result.aiAnalysis.summary.scopeDescription}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-semibold">{result.aiAnalysis.summary.estimatedDuration}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Complexity</p>
              <p className="font-semibold capitalize">{result.aiAnalysis.summary.complexityRating}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Total Estimate</p>
              <p className="font-semibold text-primary">
                {formatCurrency(result.estimate.totalCost)}
              </p>
            </div>
          </div>
        </div>

        {/* Good-Better-Best Preview */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="font-semibold text-gray-900">Suggested Pricing Tiers</h4>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {(["good", "better", "best"] as const).map((tier) => {
              const tierData = result.aiAnalysis.suggestedTiers[tier];
              const price = result.estimate.totalCost * tierData.priceMultiplier;
              return (
                <div
                  key={tier}
                  className={cn(
                    "rounded-lg border p-4",
                    tier === "better" ? "border-primary bg-primary/5" : "border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium capitalize">{tier}</h5>
                    {tier === "better" && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-bold">{formatCurrency(price)}</p>
                  <p className="mt-2 text-sm text-gray-600">{tierData.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warnings */}
        {result.aiAnalysis.warnings.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Warnings & Notes</h4>
            {result.aiAnalysis.warnings.map((warning, index) => (
              <div
                key={index}
                className={cn("rounded-lg border p-4", getSeverityColor(warning.severity))}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{warning.message}</p>
                    <p className="mt-1 text-sm opacity-80">{warning.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Questions */}
        {result.aiAnalysis.questions.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h4 className="flex items-center gap-2 font-semibold text-gray-900">
              <HelpCircle className="h-5 w-5" />
              Questions to Verify
            </h4>
            <ul className="mt-3 space-y-2">
              {result.aiAnalysis.questions.map((question, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-600">
                  <span className="font-medium text-gray-400">{index + 1}.</span>
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setResult(null)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Generate New Estimate
          </button>
          <a
            href={`/projects/${projectId}/estimate`}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            View & Edit Estimate
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Estimate Generator</h3>
          <p className="text-sm text-gray-500">
            Upload photos and describe the scope to generate an accurate estimate
          </p>
        </div>
      </div>

      {/* Project Type */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Project Type</p>
        <p className="font-medium text-gray-900">
          {projectTypeLabels[projectType] || projectType}
        </p>
      </div>

      {/* Photos */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Project Photos (Optional)
        </label>
        <PhotoUploader photos={photos} onPhotosChange={setPhotos} disabled={loading} />
      </div>

      {/* Scope Description */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Scope Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={scopeDescription}
          onChange={(e) => setScopeDescription(e.target.value)}
          placeholder="Describe the work to be done in detail. Include materials, finishes, and any specific requirements..."
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={loading}
        />
      </div>

      {/* Quality Tier */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Quality Tier</label>
        <div className="grid gap-3 sm:grid-cols-3">
          {qualityTiers.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => setQualityTier(tier.value as any)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                qualityTier === tier.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
              disabled={loading}
            >
              <p className="font-medium text-gray-900">{tier.label}</p>
              <p className="text-sm text-gray-500">{tier.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Measurements */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Measurements (Optional)</label>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {showDetails ? "Hide suggestions" : "Show suggestions"}
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showDetails && (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestedMeasurements.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => addSuggestedMeasurement(m.name, m.unit)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-primary hover:text-primary"
              >
                + {m.name}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {measurements.map((m, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={m.name}
                onChange={(e) => updateMeasurement(index, "name", e.target.value)}
                placeholder="Measurement name"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={loading}
              />
              <input
                type="number"
                value={m.value}
                onChange={(e) => updateMeasurement(index, "value", e.target.value)}
                placeholder="Value"
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={loading}
              />
              <select
                value={m.unit}
                onChange={(e) => updateMeasurement(index, "unit", e.target.value)}
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                disabled={loading}
              >
                <option value="ft">ft</option>
                <option value="sqft">sqft</option>
                <option value="inches">in</option>
                <option value="count">count</option>
              </select>
              <button
                type="button"
                onClick={() => removeMeasurement(index)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-gray-500 hover:bg-gray-50"
                disabled={loading}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMeasurement}
            className="text-sm text-primary hover:underline"
            disabled={loading}
          >
            + Add measurement
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading || !scopeDescription.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating Estimate...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate AI Estimate
          </>
        )}
      </button>

      <p className="text-center text-xs text-gray-500">
        AI estimates are based on typical project costs and may need adjustment for your specific
        situation. Always verify measurements and scope on-site.
      </p>
    </div>
  );
}
