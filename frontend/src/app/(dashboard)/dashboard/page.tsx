"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  FolderKanban,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Phone,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface DashboardStats {
  leadsToday: number;
  leadsTotalActive: number;
  proposalsPending: number;
  projectsInProgress: number;
  monthlyRevenue: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    leadsToday: 0,
    leadsTotalActive: 0,
    proposalsPending: 0,
    projectsInProgress: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch real stats from API
    // For now, use placeholder data
    setStats({
      leadsToday: 3,
      leadsTotalActive: 12,
      proposalsPending: 5,
      projectsInProgress: 8,
      monthlyRevenue: 47500,
    });
    setLoading(false);
  }, []);

  const kpiCards = [
    {
      title: "Leads Today",
      value: stats.leadsToday,
      subtitle: `${stats.leadsTotalActive} active total`,
      icon: Phone,
      color: "bg-blue-500",
      href: "/leads",
    },
    {
      title: "Proposals Pending",
      value: stats.proposalsPending,
      subtitle: "Awaiting response",
      icon: FileText,
      color: "bg-amber-500",
      href: "/proposals",
    },
    {
      title: "Jobs In Progress",
      value: stats.projectsInProgress,
      subtitle: "Currently active",
      icon: FolderKanban,
      color: "bg-purple-500",
      href: "/projects?status=IN_PROGRESS",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(stats.monthlyRevenue),
      subtitle: "This month",
      icon: DollarSign,
      color: "bg-green-500",
      href: "/analytics",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/leads/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {typeof card.value === "number" ? card.value : card.value}
                </p>
                <p className="mt-1 text-sm text-gray-500">{card.subtitle}</p>
              </div>
              <div
                className={`rounded-lg ${card.color} p-3 text-white`}
              >
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-gray-400" />
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
            <Link
              href="/leads"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {/* Placeholder leads */}
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">John Smith</p>
                <p className="text-sm text-gray-500">Kitchen Remodel</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                New
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">Sarah Johnson</p>
                <p className="text-sm text-gray-500">Bathroom Remodel</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                Appointment
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">Mike Davis</p>
                <p className="text-sm text-gray-500">Deck/Patio</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                Follow Up
              </span>
            </div>
          </div>
        </div>

        {/* Pending Proposals */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Proposals
            </h2>
            <Link
              href="/proposals"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {/* Placeholder proposals */}
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">Master Bath Renovation</p>
                <p className="text-sm text-gray-500">Sent 2 days ago</p>
              </div>
              <span className="font-medium text-gray-900">$24,500</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">Kitchen Update</p>
                <p className="text-sm text-gray-500">Viewed 1 hour ago</p>
              </div>
              <span className="font-medium text-gray-900">$32,750</span>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-gray-900">Roof Replacement</p>
                <p className="text-sm text-gray-500">Sent 5 days ago</p>
              </div>
              <span className="font-medium text-gray-900">$15,800</span>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started (for new users) */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-blue-900">
          Getting Started
        </h3>
        <p className="mt-1 text-sm text-blue-700">
          Complete these steps to set up your account and start winning more jobs.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">Add your company info</p>
              <Link
                href="/settings"
                className="text-sm text-blue-600 hover:underline"
              >
                Go to settings
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">Set up pricing</p>
              <Link
                href="/settings/pricing"
                className="text-sm text-blue-600 hover:underline"
              >
                Configure rates
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Create your first lead</p>
              <Link
                href="/leads/new"
                className="text-sm text-blue-600 hover:underline"
              >
                Add a lead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
