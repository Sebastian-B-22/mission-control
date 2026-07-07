"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Home, Mail } from "lucide-react";

type StoredReservation = {
  family?: {
    parentFirstName?: string;
    email?: string;
  };
  child?: {
    firstName?: string;
    ageTrack?: string;
  };
};

export default function FoundingFamiliesWaitlistConfirmedPage() {
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

  return (
    <main className="min-h-screen bg-[#f6fbf7] text-[#102c43]">
      <section className="border-b border-[#d6e6df] bg-white">
        <div className="mx-auto w-full max-w-4xl px-5 py-10 md:px-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#c9e2d4] bg-[#f6fbf7] px-4 py-2 text-xs font-black uppercase text-[#179b57]">
            <CheckCircle2 className="h-4 w-4" /> Interest saved
          </p>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">You are on the HTA waitlist.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#405a6d]">
            Thanks, {parentName}. The first HTA Founding Families wave is focused on ages 3-8, and we saved your interest for the next expansion.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#405a6d]">
            No payment has been collected. We will send updates when HTA opens the next age track or expansion wave.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-4 px-5 py-8 md:grid-cols-2 md:px-8">
        <Link href="/hta" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#179b57] px-5 py-3 text-sm font-black text-white hover:bg-[#127f48]">
          <Home className="h-4 w-4" /> HTA Home
        </Link>
        <a href="mailto:hello@hometeamacademy.com" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#b8d7e7] bg-white px-5 py-3 text-sm font-black text-[#102c43]">
          <Mail className="h-4 w-4" /> Ask a Question <ArrowRight className="h-4 w-4" />
        </a>
      </section>
    </main>
  );
}
