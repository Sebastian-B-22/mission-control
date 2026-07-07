"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Download, Home, Mail, PackageOpen } from "lucide-react";

type StoredReservation = {
  family?: {
    parentFirstName?: string;
    email?: string;
  };
  child?: {
    firstName?: string;
    ageTrack?: string;
    shirtSize?: string;
  };
  shipping?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  siblingInterest?: {
    selected?: boolean;
  };
};

export default function FoundingFamiliesReservedPage() {
  const [reservation, setReservation] = useState<StoredReservation | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("hta_founding_families_reservation");
    if (!raw) return;
    try {
      setReservation(JSON.parse(raw) as StoredReservation);
    } catch {
      setReservation(null);
    }
  }, []);

  const parentName = reservation?.family?.parentFirstName || "Friend";
  const childName = reservation?.child?.firstName || "your child";
  const siblingInterest = reservation?.siblingInterest?.selected ? "Saved for follow-up" : "Not selected";

  return (
    <main className="min-h-screen bg-[#f6fbf7] text-[#102c43]">
      <section className="border-b border-[#d6e6df] bg-white">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-10 md:grid-cols-[1fr_320px] md:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#c9e2d4] bg-[#f6fbf7] px-4 py-2 text-xs font-black uppercase text-[#179b57]">
              <CheckCircle2 className="h-4 w-4" /> Reservation saved
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Your Founding Family spot is reserved.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#405a6d]">
              {parentName}, we saved a first-wave HTA Founding Families reservation for {childName}.
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#405a6d]">
              No payment has been collected. We will send checkout details when production, shipment, support, and refund rules are ready.
            </p>
          </div>
          <div className="rounded-md border border-[#17324d] bg-[#102c43] p-5 text-white">
            <PackageOpen className="h-8 w-8 text-[#66d38c]" />
            <p className="mt-4 text-sm font-black uppercase text-[#ffdc4d]">Order preview</p>
            <div className="mt-4 grid gap-3 text-sm font-bold text-[#dcebf0]">
              <div className="flex justify-between gap-3"><span>HTA Founding Families</span><span>$196</span></div>
              <div className="border-t border-white/15 pt-3 text-white">Welcome Box + first 3 monthly soccer adventure boxes</div>
              <div>Planned September shipment</div>
              <div>Payment today: $0</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-6 px-5 py-8 md:grid-cols-2 md:px-8">
        <div className="rounded-md border border-[#d6e6df] bg-white p-5">
          <h2 className="text-xl font-black">What happens next</h2>
          <div className="mt-5 grid gap-4">
            {[
              "Corinne's team uses reservations to plan box quantities, shirt sizes, age tracks, and launch support.",
              "First-wave families receive production and shipment updates before checkout opens.",
              "Checkout opens only after shipment details and refund rules are finalized.",
            ].map((copy) => (
              <div key={copy} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-[#179b57]" />
                <p className="text-sm font-bold leading-6 text-[#405a6d]">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-[#d6e6df] bg-white p-5">
          <h2 className="text-xl font-black">Reservation details</h2>
          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between gap-4"><span>Age track</span><strong>{reservation?.child?.ageTrack || "Little Champions / Skills Squad"}</strong></div>
            <div className="flex justify-between gap-4"><span>Child shirt</span><strong>{reservation?.child?.shirtSize || "Saved at signup"}</strong></div>
            <div className="flex justify-between gap-4"><span>Shipping area</span><strong>{[reservation?.shipping?.city, reservation?.shipping?.state, reservation?.shipping?.zip].filter(Boolean).join(", ") || "Saved at signup"}</strong></div>
            <div className="flex justify-between gap-4"><span>Email</span><strong>{reservation?.family?.email || "Saved at signup"}</strong></div>
            <div className="flex justify-between gap-4"><span>Sibling interest</span><strong>{siblingInterest}</strong></div>
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
