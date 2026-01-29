"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MapPin,
  User,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import {
  formatCurrency,
  formatRelativeTime,
  projectStatusLabels,
  projectTypeLabels,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Status badge colors
const statusColors: Record<string, string> = {
  ESTIMATE: "bg-gray-100 text-gray-800",
  PROPOSAL_SENT: "bg-blue-100 text-blue-800",
  PROPOSAL_VIEWED: "bg-indigo-100 text-indigo-800",
  NEGOTIATING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DEPOSIT_RECEIVED: "bg-emerald-100 text-emerald-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  ON_HOLD: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-teal-100 text-teal-800",
  INVOICED: "bg-cyan-100 text-cyan-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// Placeholder data
const placeholderProjects = [
  {
    id: "1",
    projectNumber: "P-00001",
    name: "Master Bath Renovation",
    projectType: "BATHROOM_REMODEL",
    status: "IN_PROGRESS",
    clientFirstName: "John",
    clientLastName: "Smith",
    address: "123 Main St",
    city: "Denver",
    state: "CO",
    contractValue: 32750,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    projectNumber: "P-00002",
    name: "Kitchen Update",
    projectType: "KITCHEN_REMODEL",
    status: "PROPOSAL_SENT",
    clientFirstName: "Sarah",
    clientLastName: "Johnson",
    address: "456 Oak Ave",
    city: "Boulder",
    state: "CO",
    contractValue: 45000,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    projectNumber: "P-00003",
    name: "New Deck Installation",
    projectType: "DECK_PATIO",
    status: "ESTIMATE",
    clientFirstName: "Mike",
    clientLastName: "Davis",
    address: "789 Pine Rd",
    city: "Lakewood",
    state: "CO",
    contractValue: 0,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    projectNumber: "P-00004",
    name: "Roof Replacement",
    projectType: "ROOFING",
    status: "COMPLETED",
    clientFirstName: "Emily",
    clientLastName: "Wilson",
    address: "321 Elm St",
    city: "Aurora",
    state: "CO",
    contractValue: 15800,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredProjects = placeholderProjects.filter((project) => {
    const matchesSearch =
      !searchQuery ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.projectNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${project.clientFirstName} ${project.clientLastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage estimates, proposals, and active jobs
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
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
          {Object.entries(projectStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Project Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {project.projectNumber}
                  </p>
                  <h3 className="mt-1 font-semibold text-gray-900 group-hover:text-primary">
                    {project.name}
                  </h3>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    statusColors[project.status]
                  )}
                >
                  {projectStatusLabels[project.status]}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {project.clientFirstName} {project.clientLastName}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {project.city}, {project.state}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatRelativeTime(project.createdAt)}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-500">
                  {projectTypeLabels[project.projectType]}
                </span>
                {project.contractValue > 0 && (
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(project.contractValue)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white py-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">No projects found</p>
        </div>
      )}
    </div>
  );
}
