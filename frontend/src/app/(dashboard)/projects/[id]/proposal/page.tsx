"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Send,
  Eye,
  ExternalLink,
  Clock,
  Check,
  Copy,
} from "lucide-react";
import { ProposalGenerator } from "@/components/proposals/ProposalGenerator";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/formatters";

// Placeholder estimates for demo
const placeholderEstimates = [
  {
    id: "est-1",
    name: "Initial Estimate",
    totalCost: 24500,
    materialCost: 12500,
    laborCost: 8500,
    status: "FINAL",
    createdAt: "2024-03-15T10:00:00Z",
  },
];

// Placeholder proposals for demo
const placeholderProposals = [
  {
    id: "prop-1",
    title: "Master Bath Renovation Proposal",
    status: "SENT",
    goodTierPrice: 20000,
    betterTierPrice: 24500,
    bestTierPrice: 30625,
    viewCount: 3,
    createdAt: "2024-03-16T10:00:00Z",
    publicUrl: "abc123xyz789",
  },
];

export default function ProjectProposalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [mode, setMode] = useState<"list" | "create">("list");
  const [estimates, setEstimates] = useState(placeholderEstimates);
  const [proposals, setProposals] = useState(placeholderProposals);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // TODO: Fetch real data
  useEffect(() => {
    // fetch(`/api/projects/${projectId}/estimates`)...
    // fetch(`/api/projects/${projectId}/proposals`)...
  }, [projectId]);

  const handleProposalGenerated = (proposalId: string) => {
    // Refresh proposals list
    console.log("Proposal generated:", proposalId);
  };

  const copyProposalUrl = (publicUrl: string) => {
    const url = `${window.location.origin}/proposal/${publicUrl}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(publicUrl);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SENT: "bg-blue-100 text-blue-800",
    VIEWED: "bg-indigo-100 text-indigo-800",
    SIGNED: "bg-green-100 text-green-800",
    DEPOSIT_PAID: "bg-emerald-100 text-emerald-800",
    EXPIRED: "bg-orange-100 text-orange-800",
    DECLINED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
            <p className="text-sm text-gray-500">
              Create and manage project proposals
            </p>
          </div>
        </div>
        {mode === "list" && (
          <button
            onClick={() => setMode("create")}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Create Proposal
          </button>
        )}
      </div>

      {mode === "create" ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New Proposal
            </h2>
            <button
              onClick={() => setMode("list")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <ProposalGenerator
            projectId={projectId}
            estimates={estimates}
            onProposalGenerated={handleProposalGenerated}
          />
        </div>
      ) : (
        <>
          {/* Proposals List */}
          {proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {proposal.title}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusColors[proposal.status]
                          )}
                        >
                          {proposal.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Created {formatDate(proposal.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {proposal.viewCount > 0 && (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Eye className="h-4 w-4" />
                          {proposal.viewCount} views
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tier Prices */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Good</div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(proposal.goodTierPrice)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3 ring-1 ring-primary/20">
                      <div className="text-xs text-primary">Better (Recommended)</div>
                      <div className="font-semibold text-primary">
                        {formatCurrency(proposal.betterTierPrice)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Best</div>
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(proposal.bestTierPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                    <Link
                      href={`/projects/${projectId}/proposals/${proposal.id}`}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-4 w-4" />
                      View Details
                    </Link>
                    <button
                      onClick={() => copyProposalUrl(proposal.publicUrl)}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {copiedUrl === proposal.publicUrl ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                    <a
                      href={`/proposal/${proposal.publicUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Preview
                    </a>
                    {proposal.status === "DRAFT" && (
                      <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90">
                        <Send className="h-4 w-4" />
                        Send to Client
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No Proposals Yet
              </h3>
              <p className="mt-2 text-gray-500">
                Create a Good-Better-Best proposal from your estimate to send to
                the client.
              </p>
              <button
                onClick={() => setMode("create")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" />
                Create Proposal
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
