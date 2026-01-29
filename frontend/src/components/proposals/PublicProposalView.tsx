"use client";

import { useState, useRef } from "react";
import {
  Check,
  Star,
  Shield,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPhone, formatAddress } from "@/lib/formatters";
import SignatureCanvas from "react-signature-canvas";

interface ProposalTier {
  name: string;
  description: string;
  price: number;
  items: Array<{ description: string; included: boolean }>;
}

interface Proposal {
  id: string;
  title: string;
  introduction: string;
  scopeOfWork: string;
  projectVision?: string;
  whyChooseUs?: string[];
  guarantee?: string;
  callToAction?: string;
  urgency?: string;
  estimatedDuration?: string;
  milestones?: string[];
  depositPercent: number;
  goodTierName: string;
  goodTierDescription: string;
  goodTierPrice: number;
  goodTierItems: Array<{ description: string; included: boolean }>;
  betterTierName: string;
  betterTierDescription: string;
  betterTierPrice: number;
  betterTierItems: Array<{ description: string; included: boolean }>;
  bestTierName: string;
  bestTierDescription: string;
  bestTierPrice: number;
  bestTierItems: Array<{ description: string; included: boolean }>;
  status: string;
  signedAt?: string;
  selectedTier?: string;
  project: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    clientFirstName?: string;
    clientLastName?: string;
  };
  company: {
    name: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    licenseNumber?: string;
    insuranceInfo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

interface PublicProposalViewProps {
  proposal: Proposal;
  publicUrl: string;
}

export function PublicProposalView({
  proposal,
  publicUrl,
}: PublicProposalViewProps) {
  const [selectedTier, setSelectedTier] = useState<"good" | "better" | "best">(
    "better"
  );
  const [showDetails, setShowDetails] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedSuccess, setSignedSuccess] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  const tiers = {
    good: {
      name: proposal.goodTierName,
      description: proposal.goodTierDescription,
      price: proposal.goodTierPrice,
      items: proposal.goodTierItems || [],
    },
    better: {
      name: proposal.betterTierName,
      description: proposal.betterTierDescription,
      price: proposal.betterTierPrice,
      items: proposal.betterTierItems || [],
      recommended: true,
    },
    best: {
      name: proposal.bestTierName,
      description: proposal.bestTierDescription,
      price: proposal.bestTierPrice,
      items: proposal.bestTierItems || [],
    },
  };

  const selectedPrice = tiers[selectedTier].price;
  const depositAmount = selectedPrice * (proposal.depositPercent / 100);

  const handleSign = async () => {
    if (!signerName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!signerEmail.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
      setError("Please provide your signature");
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      const signatureData = sigPadRef.current.toDataURL();
      const response = await fetch(`/api/proposals/${publicUrl}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedTier,
          signerName,
          signerEmail,
          signatureData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sign proposal");
      }

      setSignedSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSigning(false);
    }
  };

  const primaryColor = proposal.company.primaryColor || "#1e40af";

  // Already signed state
  if (proposal.signedAt || signedSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-xl bg-white p-8 text-center shadow-lg">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: primaryColor + "20" }}
            >
              <Check className="h-8 w-8" style={{ color: primaryColor }} />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Proposal Accepted!
            </h1>
            <p className="mt-3 text-gray-600">
              Thank you for choosing {proposal.company.name}. We&apos;re excited
              to work on your project.
            </p>
            <div
              className="mt-6 rounded-lg p-4"
              style={{ backgroundColor: primaryColor + "10" }}
            >
              <div className="text-sm text-gray-600">Selected Package</div>
              <div
                className="text-xl font-bold"
                style={{ color: primaryColor }}
              >
                {tiers[proposal.selectedTier as keyof typeof tiers]?.name ||
                  tiers[selectedTier].name}
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(
                  tiers[proposal.selectedTier as keyof typeof tiers]?.price ||
                    selectedPrice
                )}
              </div>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              A confirmation has been sent to your email. Our team will contact
              you shortly to discuss next steps.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="py-6"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {proposal.company.logoUrl ? (
                <img
                  src={proposal.company.logoUrl}
                  alt={proposal.company.name}
                  className="h-12 w-auto"
                />
              ) : (
                <div className="text-2xl font-bold text-white">
                  {proposal.company.name}
                </div>
              )}
            </div>
            {proposal.company.phone && (
              <a
                href={`tel:${proposal.company.phone}`}
                className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
              >
                <Phone className="h-4 w-4" />
                {formatPhone(proposal.company.phone)}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="text-sm text-gray-500">Proposal for</div>
          <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
          <div className="mt-2 text-gray-600">
            Prepared for {proposal.project.clientFirstName}{" "}
            {proposal.project.clientLastName}
          </div>
        </div>

        {/* Introduction */}
        {proposal.introduction && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <p className="text-lg text-gray-700 leading-relaxed">
              {proposal.introduction}
            </p>
          </div>
        )}

        {/* Project Vision */}
        {proposal.projectVision && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Vision, Realized
            </h2>
            <p className="mt-3 text-gray-700">{proposal.projectVision}</p>
          </div>
        )}

        {/* Scope Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mb-4 flex w-full items-center justify-between rounded-lg bg-white px-6 py-4 shadow-sm"
        >
          <span className="font-medium text-gray-900">Scope of Work</span>
          {showDetails ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        {showDetails && proposal.scopeOfWork && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <div className="prose prose-gray max-w-none">
              {proposal.scopeOfWork.split("\n").map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        {(proposal.estimatedDuration || proposal.milestones?.length) && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5" style={{ color: primaryColor }} />
              Project Timeline
            </h2>
            {proposal.estimatedDuration && (
              <div className="mt-4 text-lg font-medium" style={{ color: primaryColor }}>
                Estimated Duration: {proposal.estimatedDuration}
              </div>
            )}
            {proposal.milestones && proposal.milestones.length > 0 && (
              <div className="mt-4 space-y-2">
                {proposal.milestones.map((milestone, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-gray-700">{milestone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Good-Better-Best Tiers */}
        <div className="mb-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
            Choose Your Package
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {(["good", "better", "best"] as const).map((tierKey) => {
              const tier = tiers[tierKey];
              const isSelected = selectedTier === tierKey;
              const isRecommended = tierKey === "better";

              return (
                <button
                  key={tierKey}
                  onClick={() => setSelectedTier(tierKey)}
                  className={cn(
                    "relative rounded-xl border-2 p-6 text-left transition-all",
                    isSelected
                      ? "border-primary shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  style={isSelected ? { borderColor: primaryColor } : {}}
                >
                  {isRecommended && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      MOST POPULAR
                    </span>
                  )}

                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tier.name}
                    </h3>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2",
                        isSelected ? "border-primary bg-primary" : "border-gray-300"
                      )}
                      style={isSelected ? { borderColor: primaryColor, backgroundColor: primaryColor } : {}}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </div>

                  <div
                    className="mt-4 text-3xl font-bold"
                    style={{ color: isSelected ? primaryColor : "#111827" }}
                  >
                    {formatCurrency(tier.price)}
                  </div>

                  <p className="mt-3 text-sm text-gray-600">{tier.description}</p>

                  {tier.items && tier.items.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {tier.items.slice(0, 5).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0"
                            style={{ color: primaryColor }}
                          />
                          <span className="text-gray-700">{item.description}</span>
                        </li>
                      ))}
                      {tier.items.length > 5 && (
                        <li className="text-sm text-gray-500">
                          +{tier.items.length - 5} more features
                        </li>
                      )}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Why Choose Us */}
        {proposal.whyChooseUs && proposal.whyChooseUs.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5" style={{ color: primaryColor }} />
              Why Choose {proposal.company.name}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {proposal.whyChooseUs.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Star
                    className="mt-0.5 h-5 w-5 shrink-0"
                    style={{ color: primaryColor }}
                  />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guarantee */}
        {proposal.guarantee && (
          <div
            className="mb-8 rounded-xl p-6"
            style={{ backgroundColor: primaryColor + "10" }}
          >
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 shrink-0" style={{ color: primaryColor }} />
              <div>
                <h3 className="font-semibold text-gray-900">Our Guarantee</h3>
                <p className="mt-2 text-gray-700">{proposal.guarantee}</p>
              </div>
            </div>
          </div>
        )}

        {/* Urgency Banner */}
        {proposal.urgency && (
          <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
            <p className="font-medium text-amber-800">{proposal.urgency}</p>
          </div>
        )}

        {/* Signature Section */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Accept This Proposal
          </h2>
          <p className="mt-2 text-gray-600">
            {proposal.callToAction ||
              "Sign below to accept this proposal and get started on your project."}
          </p>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Selected Package</div>
                <div className="font-semibold text-gray-900">
                  {tiers[selectedTier].name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Investment</div>
                <div
                  className="text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  {formatCurrency(selectedPrice)}
                </div>
              </div>
            </div>
            <div className="mt-3 border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Deposit Due ({proposal.depositPercent}%)
                </span>
                <span className="font-medium">{formatCurrency(depositAmount)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              Signature
            </label>
            <div className="mt-1 rounded-lg border border-gray-300 bg-white">
              <SignatureCanvas
                ref={sigPadRef}
                canvasProps={{
                  className: "w-full h-32",
                }}
              />
            </div>
            <button
              onClick={() => sigPadRef.current?.clear()}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Clear signature
            </button>
          </div>

          <button
            onClick={handleSign}
            disabled={isSigning}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {isSigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Accept Proposal & Pay Deposit
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            By signing, you agree to the scope of work and terms outlined in
            this proposal.
          </p>
        </div>

        {/* Company Footer */}
        <footer className="mt-12 border-t border-gray-200 pt-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="font-semibold text-gray-900">
                {proposal.company.name}
              </h4>
              {proposal.company.licenseNumber && (
                <p className="mt-1 text-sm text-gray-600">
                  License #{proposal.company.licenseNumber}
                </p>
              )}
              {proposal.company.insuranceInfo && (
                <p className="mt-1 text-sm text-gray-600">
                  {proposal.company.insuranceInfo}
                </p>
              )}
            </div>
            <div>
              {proposal.company.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {formatAddress(
                      proposal.company.address,
                      proposal.company.city || "",
                      proposal.company.state || "",
                      proposal.company.zip || ""
                    )}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {proposal.company.phone && (
                <a
                  href={`tel:${proposal.company.phone}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Phone className="h-4 w-4" />
                  {formatPhone(proposal.company.phone)}
                </a>
              )}
              {proposal.company.email && (
                <a
                  href={`mailto:${proposal.company.email}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Mail className="h-4 w-4" />
                  {proposal.company.email}
                </a>
              )}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
