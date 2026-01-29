"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye, Clock, CheckCircle, DollarSign } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SENT: "bg-blue-100 text-blue-800",
  VIEWED: "bg-indigo-100 text-indigo-800",
  SIGNED: "bg-green-100 text-green-800",
  DEPOSIT_PAID: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-orange-100 text-orange-800",
  DECLINED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED: "Viewed",
  SIGNED: "Signed",
  DEPOSIT_PAID: "Deposit Paid",
  EXPIRED: "Expired",
  DECLINED: "Declined",
};

// Placeholder data
const placeholderProposals = [
  {
    id: "1",
    title: "Master Bath Renovation",
    status: "SENT",
    betterTierPrice: 32750,
    selectedTier: null,
    viewCount: 3,
    clientName: "John Smith",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastViewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    title: "Kitchen Update",
    status: "VIEWED",
    betterTierPrice: 45000,
    selectedTier: null,
    viewCount: 5,
    clientName: "Sarah Johnson",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastViewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "Roof Replacement",
    status: "SIGNED",
    betterTierPrice: 15800,
    selectedTier: "better",
    viewCount: 2,
    clientName: "Mike Davis",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    lastViewedAt: null,
  },
  {
    id: "4",
    title: "Deck & Patio",
    status: "DEPOSIT_PAID",
    betterTierPrice: 24500,
    selectedTier: "best",
    viewCount: 4,
    clientName: "Emily Wilson",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastViewedAt: null,
  },
];

export default function ProposalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredProposals = placeholderProposals.filter((proposal) => {
    const matchesSearch =
      !searchQuery ||
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track and manage your proposals
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">3</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Eye className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">2</p>
              <p className="text-sm text-gray-500">Viewed</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-sm text-gray-500">Won</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">$118k</p>
              <p className="text-sm text-gray-500">Won Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search proposals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Proposal List */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Proposal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/projects/${proposal.id}/proposal`}
                      className="font-medium text-gray-900 hover:text-primary"
                    >
                      {proposal.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      Created {formatRelativeTime(proposal.createdAt)}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {proposal.clientName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(proposal.betterTierPrice)}
                    </span>
                    {proposal.selectedTier && (
                      <p className="text-xs text-gray-500">
                        Selected: {proposal.selectedTier}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusColors[proposal.status]
                      )}
                    >
                      {statusLabels[proposal.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {proposal.viewCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {proposal.viewCount} views
                      </div>
                    )}
                    {proposal.lastViewedAt && (
                      <p className="text-xs">
                        Last viewed {formatRelativeTime(proposal.lastViewedAt)}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
