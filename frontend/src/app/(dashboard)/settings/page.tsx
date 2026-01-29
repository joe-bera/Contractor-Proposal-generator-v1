"use client";

import Link from "next/link";
import {
  Building2,
  DollarSign,
  FileText,
  Plug,
  Bell,
  Users,
  ChevronRight,
} from "lucide-react";

const settingsSections = [
  {
    title: "Company Information",
    description: "Update your company name, logo, and contact details",
    icon: Building2,
    href: "/settings/company",
  },
  {
    title: "Pricing & Rates",
    description: "Configure labor rates, material markups, and profit margins",
    icon: DollarSign,
    href: "/settings/pricing",
  },
  {
    title: "Templates",
    description: "Manage proposal, estimate, and email templates",
    icon: FileText,
    href: "/settings/templates",
  },
  {
    title: "Integrations",
    description: "Connect GoHighLevel, Stripe, and Voice AI services",
    icon: Plug,
    href: "/settings/integrations",
  },
  {
    title: "Notifications",
    description: "Configure email and SMS notifications",
    icon: Bell,
    href: "/settings/notifications",
  },
  {
    title: "Team",
    description: "Manage team members and permissions",
    icon: Users,
    href: "/settings/team",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account and company settings
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            <div className="rounded-lg bg-primary/10 p-3">
              <section.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary">
                  {section.title}
                </h3>
                <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Quick Settings</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">
                Receive email alerts for new leads and signed proposals
              </p>
            </div>
            <button
              type="button"
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-500">
                Get text messages for urgent leads
              </p>
            </div>
            <button
              type="button"
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Auto Follow-up</p>
              <p className="text-sm text-gray-500">
                Automatically send follow-up emails for unviewed proposals
              </p>
            </div>
            <button
              type="button"
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
