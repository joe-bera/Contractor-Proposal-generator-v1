"use client";

import { TrendingUp, TrendingDown, DollarSign, Target, Users, FileText } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/formatters";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your business performance and identify opportunities
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-green-100 p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <span className="flex items-center text-sm text-green-600">
              <TrendingUp className="mr-1 h-4 w-4" />
              12%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">$127,500</p>
          <p className="text-sm text-gray-500">Monthly Revenue</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-100 p-2">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <span className="flex items-center text-sm text-green-600">
              <TrendingUp className="mr-1 h-4 w-4" />
              5%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">34.2%</p>
          <p className="text-sm text-gray-500">Average Margin</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-purple-100 p-2">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <span className="flex items-center text-sm text-green-600">
              <TrendingUp className="mr-1 h-4 w-4" />
              8%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">67%</p>
          <p className="text-sm text-gray-500">Proposal Close Rate</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-amber-100 p-2">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <span className="flex items-center text-sm text-red-600">
              <TrendingDown className="mr-1 h-4 w-4" />
              3%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">24</p>
          <p className="text-sm text-gray-500">New Leads (30d)</p>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <div className="mt-4 flex h-64 items-center justify-center rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500">Chart coming soon</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Proposal Performance</h3>
          <div className="mt-4 flex h-64 items-center justify-center rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500">Chart coming soon</p>
          </div>
        </div>
      </div>

      {/* Estimation Accuracy */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Estimation Accuracy</h3>
        <p className="mt-1 text-sm text-gray-500">
          How close your estimates are to actual job costs
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">92%</p>
            <p className="mt-1 text-sm text-gray-500">Overall Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">94%</p>
            <p className="mt-1 text-sm text-gray-500">Material Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">89%</p>
            <p className="mt-1 text-sm text-gray-500">Labor Accuracy</p>
          </div>
        </div>
      </div>

      {/* Top Project Types */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Top Project Types</h3>
        <div className="mt-4 space-y-4">
          {[
            { type: "Kitchen Remodel", count: 12, revenue: 540000, margin: 32 },
            { type: "Bathroom Remodel", count: 18, revenue: 396000, margin: 35 },
            { type: "Roofing", count: 8, revenue: 128000, margin: 28 },
            { type: "Deck/Patio", count: 6, revenue: 102000, margin: 38 },
          ].map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
            >
              <div>
                <p className="font-medium text-gray-900">{item.type}</p>
                <p className="text-sm text-gray-500">{item.count} projects</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatCurrency(item.revenue)}
                </p>
                <p className="text-sm text-gray-500">{formatPercent(item.margin)} margin</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
