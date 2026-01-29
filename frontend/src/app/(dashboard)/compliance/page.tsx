"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  MapPin,
  ChevronRight,
  RefreshCw,
  Shield,
  Send,
  Download,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";

// Type labels
const complianceTypeLabels: Record<string, string> = {
  PRELIMINARY_NOTICE: "Preliminary Notice",
  MECHANICS_LIEN: "Mechanics Lien",
  NOTICE_OF_COMPLETION: "Notice of Completion",
  CONDITIONAL_LIEN_WAIVER: "Conditional Lien Waiver",
  UNCONDITIONAL_LIEN_WAIVER: "Unconditional Lien Waiver",
  STOP_NOTICE: "Stop Notice",
};

// Status colors
const statusColors: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-800",
  WARNING: "bg-orange-100 text-orange-800",
  SENT: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  FILED: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-red-100 text-red-800",
  WAIVED: "bg-gray-100 text-gray-800",
  NOT_REQUIRED: "bg-gray-100 text-gray-500",
};

// Placeholder data for demo
const placeholderDashboard = {
  summary: {
    overdueCount: 2,
    urgentCount: 3,
    upcomingCount: 5,
    completedThisMonth: 8,
  },
  overdue: [
    {
      id: "comp-1",
      type: "PRELIMINARY_NOTICE",
      status: "EXPIRED",
      state: "CA",
      deadlineDate: "2024-03-10T00:00:00Z",
      projectId: "proj-1",
      project: {
        name: "Kitchen Renovation - Smith",
        clientFirstName: "John",
        clientLastName: "Smith",
        address: "123 Main St",
        city: "Los Angeles",
        state: "CA",
      },
    },
    {
      id: "comp-2",
      type: "MECHANICS_LIEN",
      status: "WARNING",
      state: "CA",
      deadlineDate: "2024-03-15T00:00:00Z",
      projectId: "proj-2",
      project: {
        name: "Bathroom Remodel - Johnson",
        clientFirstName: "Sarah",
        clientLastName: "Johnson",
        address: "456 Oak Ave",
        city: "San Diego",
        state: "CA",
      },
    },
  ],
  urgent: [
    {
      id: "comp-3",
      type: "PRELIMINARY_NOTICE",
      status: "PENDING",
      state: "AZ",
      deadlineDate: "2024-03-25T00:00:00Z",
      projectId: "proj-3",
      project: {
        name: "Deck Addition - Williams",
        clientFirstName: "Mike",
        clientLastName: "Williams",
        address: "789 Pine Rd",
        city: "Phoenix",
        state: "AZ",
      },
    },
    {
      id: "comp-4",
      type: "PRELIMINARY_NOTICE",
      status: "WARNING",
      state: "TX",
      deadlineDate: "2024-03-27T00:00:00Z",
      projectId: "proj-4",
      project: {
        name: "Roof Replacement - Brown",
        clientFirstName: "Emily",
        clientLastName: "Brown",
        address: "321 Cedar Ln",
        city: "Houston",
        state: "TX",
      },
    },
    {
      id: "comp-5",
      type: "MECHANICS_LIEN",
      status: "PENDING",
      state: "FL",
      deadlineDate: "2024-03-28T00:00:00Z",
      projectId: "proj-5",
      project: {
        name: "Flooring Install - Davis",
        clientFirstName: "Robert",
        clientLastName: "Davis",
        address: "654 Maple Dr",
        city: "Miami",
        state: "FL",
      },
    },
  ],
  upcoming: [
    {
      id: "comp-6",
      type: "PRELIMINARY_NOTICE",
      status: "PENDING",
      state: "CA",
      deadlineDate: "2024-04-05T00:00:00Z",
      projectId: "proj-6",
      project: {
        name: "Window Replacement - Miller",
        clientFirstName: "Jennifer",
        clientLastName: "Miller",
        address: "987 Elm St",
        city: "San Francisco",
        state: "CA",
      },
    },
  ],
  recentlyCompleted: [
    {
      id: "comp-7",
      type: "PRELIMINARY_NOTICE",
      status: "DELIVERED",
      state: "CA",
      completedDate: "2024-03-12T00:00:00Z",
      projectId: "proj-7",
      project: {
        name: "Garage Conversion - Wilson",
      },
    },
    {
      id: "comp-8",
      type: "PRELIMINARY_NOTICE",
      status: "DELIVERED",
      state: "NV",
      completedDate: "2024-03-10T00:00:00Z",
      projectId: "proj-8",
      project: {
        name: "HVAC Install - Taylor",
      },
    },
  ],
};

export default function ComplianceDashboard() {
  const [dashboard, setDashboard] = useState(placeholderDashboard);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // TODO: Fetch real data
  useEffect(() => {
    // fetch('/api/compliance/dashboard')...
  }, []);

  const refreshDashboard = async () => {
    setLoading(true);
    // TODO: Fetch and update dashboard
    setTimeout(() => setLoading(false), 1000);
  };

  const getDaysUntil = (dateStr: string) => {
    const deadline = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDaysOverdue = (dateStr: string) => {
    const deadline = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Compliance Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Track preliminary notices, mechanics liens, and protect your lien rights
          </p>
        </div>
        <button
          onClick={refreshDashboard}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className={cn(
            "rounded-xl border p-6",
            dashboard.summary.overdueCount > 0
              ? "border-red-200 bg-red-50"
              : "border-gray-200 bg-white"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                dashboard.summary.overdueCount > 0
                  ? "bg-red-100"
                  : "bg-gray-100"
              )}
            >
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  dashboard.summary.overdueCount > 0
                    ? "text-red-600"
                    : "text-gray-400"
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  dashboard.summary.overdueCount > 0
                    ? "text-red-600"
                    : "text-gray-900"
                )}
              >
                {dashboard.summary.overdueCount}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "rounded-xl border p-6",
            dashboard.summary.urgentCount > 0
              ? "border-orange-200 bg-orange-50"
              : "border-gray-200 bg-white"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                dashboard.summary.urgentCount > 0
                  ? "bg-orange-100"
                  : "bg-gray-100"
              )}
            >
              <Clock
                className={cn(
                  "h-5 w-5",
                  dashboard.summary.urgentCount > 0
                    ? "text-orange-600"
                    : "text-gray-400"
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Due This Week</p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  dashboard.summary.urgentCount > 0
                    ? "text-orange-600"
                    : "text-gray-900"
                )}
              >
                {dashboard.summary.urgentCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Upcoming (30 days)
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.summary.upcomingCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Completed This Month
              </p>
              <p className="text-2xl font-bold text-green-600">
                {dashboard.summary.completedThisMonth}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Section */}
      {dashboard.overdue.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 bg-red-50 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-red-900">
              <AlertTriangle className="h-5 w-5" />
              Overdue - Immediate Action Required
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.overdue.map((item) => (
              <ComplianceItem
                key={item.id}
                item={item}
                variant="overdue"
                daysInfo={`${getDaysOverdue(item.deadlineDate)} days overdue`}
                onSelect={() => setSelectedRecord(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Urgent Section */}
      {dashboard.urgent.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-white shadow-sm">
          <div className="border-b border-orange-100 bg-orange-50 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-orange-900">
              <Clock className="h-5 w-5" />
              Due This Week
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.urgent.map((item) => (
              <ComplianceItem
                key={item.id}
                item={item}
                variant="urgent"
                daysInfo={`Due in ${getDaysUntil(item.deadlineDate)} days`}
                onSelect={() => setSelectedRecord(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      {dashboard.upcoming.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-blue-500" />
              Upcoming Deadlines (Next 30 Days)
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.upcoming.map((item) => (
              <ComplianceItem
                key={item.id}
                item={item}
                variant="upcoming"
                daysInfo={`Due ${formatDate(item.deadlineDate)}`}
                onSelect={() => setSelectedRecord(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {dashboard.recentlyCompleted.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Recently Completed
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.recentlyCompleted.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[item.status]
                    )}
                  >
                    {item.status}
                  </span>
                  <div>
                    <span className="font-medium text-gray-900">
                      {complianceTypeLabels[item.type]}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <Link
                      href={`/projects/${item.projectId}`}
                      className="text-gray-600 hover:text-primary hover:underline"
                    >
                      {item.project.name}
                    </Link>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Completed {formatDate(item.completedDate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {dashboard.overdue.length === 0 &&
        dashboard.urgent.length === 0 &&
        dashboard.upcoming.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Shield className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              All Caught Up!
            </h3>
            <p className="mt-2 text-gray-500">
              No pending compliance deadlines. Your lien rights are protected.
            </p>
          </div>
        )}
    </div>
  );
}

interface ComplianceItemProps {
  item: any;
  variant: "overdue" | "urgent" | "upcoming";
  daysInfo: string;
  onSelect: () => void;
}

function ComplianceItem({ item, variant, daysInfo, onSelect }: ComplianceItemProps) {
  const variantStyles = {
    overdue: {
      badge: "bg-red-100 text-red-800",
      days: "text-red-600 font-semibold",
      button: "bg-red-600 text-white hover:bg-red-700",
    },
    urgent: {
      badge: "bg-orange-100 text-orange-800",
      days: "text-orange-600 font-medium",
      button: "bg-orange-600 text-white hover:bg-orange-700",
    },
    upcoming: {
      badge: "bg-blue-100 text-blue-800",
      days: "text-gray-600",
      button: "bg-primary text-white hover:bg-primary/90",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              styles.badge
            )}
          >
            {complianceTypeLabels[item.type]}
          </span>
          <span className="text-sm text-gray-500">{item.state}</span>
        </div>
        <div className="mt-1">
          <Link
            href={`/projects/${item.projectId}`}
            className="font-medium text-gray-900 hover:text-primary hover:underline"
          >
            {item.project.name}
          </Link>
        </div>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          <span>
            {item.project.clientFirstName} {item.project.clientLastName}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {item.project.address}, {item.project.city}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={styles.days}>{daysInfo}</div>
          <div className="text-sm text-gray-500">
            Deadline: {formatDate(item.deadlineDate)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
              styles.button
            )}
          >
            <Send className="h-4 w-4" />
            Take Action
          </button>
        </div>
      </div>
    </div>
  );
}
