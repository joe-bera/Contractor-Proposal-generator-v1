"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { PublicProposalView } from "@/components/proposals/PublicProposalView";

export default function PublicProposalPage() {
  const params = useParams();
  const publicUrl = params.publicUrl as string;
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProposal() {
      try {
        const response = await fetch(`/api/proposals/${publicUrl}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Proposal not found");
          }
          throw new Error("Failed to load proposal");
        }
        const data = await response.json();
        setProposal(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProposal();
  }, [publicUrl]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">
            {error === "Proposal not found"
              ? "Proposal Not Found"
              : "Error Loading Proposal"}
          </h1>
          <p className="mt-2 text-gray-600">
            {error === "Proposal not found"
              ? "This proposal link may have expired or been removed."
              : "There was an error loading this proposal. Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return <PublicProposalView proposal={proposal} publicUrl={publicUrl} />;
}
