"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  Calculator,
  ClipboardList,
  Clock,
  TrendingUp,
  Edit,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatPhone,
  formatAddress,
  projectStatusLabels,
  projectTypeLabels,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Status colors
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

// Placeholder project data
const placeholderProject = {
  id: "1",
  projectNumber: "P-00001",
  name: "Master Bath Renovation",
  description: "Complete master bathroom renovation including new tile, vanity, and fixtures.",
  projectType: "BATHROOM_REMODEL",
  status: "ESTIMATE",
  address: "123 Main St",
  city: "Denver",
  state: "CO",
  zip: "80202",
  clientFirstName: "John",
  clientLastName: "Smith",
  clientEmail: "john@example.com",
  clientPhone: "5551234567",
  estimatedStartDate: "2024-04-01",
  estimatedEndDate: "2024-04-21",
  estimatedMaterialCost: 12500,
  estimatedLaborCost: 8500,
  estimatedTotalCost: 24500,
  estimatedProfit: 3500,
  estimatedMargin: 14.3,
  actualMaterialCost: 0,
  actualLaborCost: 0,
  actualTotalCost: 0,
  contractValue: 0,
  depositAmount: 0,
  depositPaid: false,
  assignedTo: {
    id: "1",
    name: "Mike Johnson",
  },
  estimates: [],
  proposals: [],
  createdAt: "2024-03-15T10:00:00Z",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState(placeholderProject);
  const [activeTab, setActiveTab] = useState<"overview" | "estimate" | "proposal" | "costing">(
    "overview"
  );

  // TODO: Fetch real project data
  useEffect(() => {
    // fetch(`/api/projects/${projectId}`)...
  }, [projectId]);

  const tabs = [
    { id: "overview", label: "Overview", icon: ClipboardList },
    { id: "estimate", label: "Estimate", icon: Calculator },
    { id: "proposal", label: "Proposal", icon: FileText },
    { id: "costing", label: "Job Costing", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/projects"
            className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusColors[project.status]
                )}
              >
                {projectStatusLabels[project.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {project.projectNumber} &middot;{" "}
              {projectTypeLabels[project.projectType]}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Edit className="h-4 w-4" />
          Edit Project
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {project.description && (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-900">Description</h3>
                <p className="mt-2 text-gray-600">{project.description}</p>
              </div>
            )}

            {/* Financial Summary */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">Financial Summary</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500">Estimated</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Materials</span>
                      <span className="font-medium">
                        {formatCurrency(project.estimatedMaterialCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labor</span>
                      <span className="font-medium">
                        {formatCurrency(project.estimatedLaborCost)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(project.estimatedTotalCost)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-500">Actual</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Materials</span>
                      <span className="font-medium">
                        {formatCurrency(project.actualMaterialCost)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labor</span>
                      <span className="font-medium">
                        {formatCurrency(project.actualLaborCost)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="font-bold">
                        {formatCurrency(project.actualTotalCost)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {project.contractValue > 0 && (
                <div className="mt-4 rounded-lg bg-green-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-900">Contract Value</span>
                    <span className="text-xl font-bold text-green-700">
                      {formatCurrency(project.contractValue)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">Timeline</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated Start</p>
                    <p className="font-medium">
                      {project.estimatedStartDate
                        ? formatDate(project.estimatedStartDate)
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Estimated End</p>
                    <p className="font-medium">
                      {project.estimatedEndDate
                        ? formatDate(project.estimatedEndDate)
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">Client</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">
                    {project.clientFirstName} {project.clientLastName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a
                    href={`tel:${project.clientPhone}`}
                    className="text-primary hover:underline"
                  >
                    {formatPhone(project.clientPhone)}
                  </a>
                </div>
                {project.clientEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a
                      href={`mailto:${project.clientEmail}`}
                      className="text-primary hover:underline"
                    >
                      {project.clientEmail}
                    </a>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">
                    {formatAddress(
                      project.address,
                      project.city,
                      project.state,
                      project.zip
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">Quick Actions</h3>
              <div className="mt-4 space-y-2">
                <Link
                  href={`/projects/${projectId}/estimate`}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Calculator className="h-4 w-4" />
                  {project.estimates?.length > 0 ? "View Estimate" : "Create Estimate"}
                </Link>
                <Link
                  href={`/projects/${projectId}/proposal`}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4" />
                  {project.proposals?.length > 0 ? "View Proposal" : "Create Proposal"}
                </Link>
                <Link
                  href={`/projects/${projectId}/job-costing`}
                  className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <DollarSign className="h-4 w-4" />
                  Track Costs
                </Link>
              </div>
            </div>

            {/* Assigned To */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">Assigned To</h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {project.assignedTo?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <span className="font-medium text-gray-900">
                  {project.assignedTo?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "estimate" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-center py-12">
            <Calculator className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Estimate Yet</h3>
            <p className="mt-2 text-gray-500">
              Create an estimate to get started with this project
            </p>
            <Link
              href={`/projects/${projectId}/estimate`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Calculator className="h-4 w-4" />
              Create Estimate
            </Link>
          </div>
        </div>
      )}

      {activeTab === "proposal" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Proposal Yet</h3>
            <p className="mt-2 text-gray-500">
              Create a proposal once you have an estimate ready
            </p>
            <Link
              href={`/projects/${projectId}/proposal`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              Create Proposal
            </Link>
          </div>
        </div>
      )}

      {activeTab === "costing" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Job Costing</h3>
            <p className="mt-2 text-gray-500">
              Track time entries and material purchases for this project
            </p>
            <Link
              href={`/projects/${projectId}/job-costing`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <DollarSign className="h-4 w-4" />
              Start Tracking
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
