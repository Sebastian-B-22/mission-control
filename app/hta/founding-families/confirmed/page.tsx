"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Download, Home, Mail, PackageOpen } from "lucide-react";

const basePrice = 196;
const siblingKitPrice = 29;

type StoredEnrollment = {
  total?: number;
  launchWave?: string;
  family?: {
    parentFirstName?: string;
    email?: string;
  };
  child?: {
    firstName?: string;
    ageTrack?: string;
    shirtSize?: string;
  };
  parentShirtSize?: string;
  shipping?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  siblingKit?: {
    selected?: boolean;
  };
};

export default function FoundingFamiliesConfirmedPage() {
  const [enrollment, setEnrollment] = useState<StoredEnrollment | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("hta_founding_families_checkout");
    if (!raw) return;
    window.setTimeout(() => {
      try {
        setEnrollment(JSON.parse(raw) as StoredEnrollment);
      } catch {
        setEnrollment(null);
      }
    }, 0);
  }, []);

  const parentName = enrollment?.family?.parentFirstName || "Friend";
  const childName = enrollment?.child?.firstName || "your child";
  const siblingKitSelected = Boolean(enrollment?.siblingKit?.selected);
  const total = enrollment?.total || basePrice + (siblingKitSelected ? siblingKitPrice : 0);

  return (
    <main className="min-h-screen bg-[#f6fbf7] text-[#102c43]">
      <section className="border-b border-[#d6e6df] bg-white">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-10 md:grid-cols-[1fr_320px] md:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#c9e2d4] bg-[#f6fbf7] px-4 py-2 text-xs font-black uppercase text-[#179b57]">
              <CheckCircle2 className="h-4 w-4" /> Checkout handoff ready
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">You are in the first wave.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#405a6d]">
              {parentName}, welcome to HTA Founding Families. {childName} is now part of the opening adventure cycle.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#405a6d]">
              Your first HTA boxes are planned for the August 1 shipment wave. We will send production and shipping updates as the first boxes come together, plus your quick-start email so your family can begin with the World Cup activities right away.
            </p>
          </div>
          <div className="rounded-md border border-[#17324d] bg-[#102c43] p-5 text-white">
            <PackageOpen className="h-8 w-8 text-[#66d38c]" />
            <p className="mt-4 text-sm font-black uppercase text-[#ffdc4d]">Order summary</p>
            <div className="mt-4 grid gap-3 text-sm font-bold text-[#dcebf0]">
              <div className="flex justify-between gap-3"><span>HTA Founding Families</span><span>${basePrice}</span></div>
              {siblingKitSelected && <div className="flex justify-between gap-3"><span>Sibling Adventure Kit</span><span>${siblingKitPrice}</span></div>}
              <div className="border-t border-white/15 pt-3 text-lg font-black text-white">Total: ${total}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-8 md:grid-cols-2 md:px-8">
        <div className="rounded-md border border-[#d6e6df] bg-white p-5">
          <h2 className="text-xl font-black">What happens next</h2>
          <div className="mt-5 grid gap-4">
            {[
              "Stripe Checkout will collect payment and return families here after payment succeeds.",
              "The webhook marks the enrollment paid and creates the August 1 fulfillment task.",
              "Corinne's team sends the confirmation email and production updates.",
            ].map((copy) => (
              <div key={copy} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-[#179b57]" />
                <p className="text-sm font-bold leading-6 text-[#405a6d]">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-[#d6e6df] bg-white p-5">
          <h2 className="text-xl font-black">Family details</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between gap-4"><span>Age track</span><strong>{enrollment?.child?.ageTrack || "Little Champions / Skills Squad"}</strong></div>
            <div className="flex justify-between gap-4"><span>Child shirt</span><strong>{enrollment?.child?.shirtSize || "Saved at signup"}</strong></div>
            <div className="flex justify-between gap-4"><span>Parent shirt</span><strong>{enrollment?.parentShirtSize || "Saved at signup"}</strong></div>
            <div className="flex justify-between gap-4"><span>Shipping</span><strong>{[enrollment?.shipping?.city, enrollment?.shipping?.state, enrollment?.shipping?.zip].filter(Boolean).join(", ") || "Saved at signup"}</strong></div>
            <div className="flex justify-between gap-4"><span>Email</span><strong>{enrollment?.family?.email || "Saved at checkout"}</strong></div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-5 pb-10 md:grid-cols-3 md:px-8">
        <Link href="/worldcup" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#179b57] px-5 py-3 text-sm font-black text-white hover:bg-[#127f48]">
          <Download className="h-4 w-4" /> World Cup Bracket
        </Link>
        <Link href="/hta" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#b8d7e7] bg-white px-5 py-3 text-sm font-black text-[#102c43]">
          <Home className="h-4 w-4" /> HTA Home
        </Link>
        <a href="mailto:hello@hometeamacademy.com" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#b8d7e7] bg-white px-5 py-3 text-sm font-black text-[#102c43]">
          <Mail className="h-4 w-4" /> Ask a Question <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </main>
  );
}
