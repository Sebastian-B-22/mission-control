"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  PackageOpen,
  ShieldCheck,
} from "lucide-react";

const basePrice = 196;
const shirtSizes = ["Youth XS", "Youth S", "Youth M", "Youth L"];
const states = ["CA", "AZ", "NV", "OR", "WA", "TX", "CO", "UT", "NY", "FL"];

function trackForAge(age: string) {
  const parsed = Number.parseInt(age, 10);
  if (!Number.isFinite(parsed)) return "";
  if (parsed >= 3 && parsed <= 5) return "Little Champions";
  if (parsed >= 6 && parsed <= 8) return "Skills Squad";
  return "Waitlist";
}

function isEligibleAge(age: string) {
  const parsed = Number.parseInt(age, 10);
  return Number.isFinite(parsed) && parsed >= 3 && parsed <= 8;
}

function getUtm() {
  const params = new URLSearchParams(window.location.search);
  const captured: Record<string, string> = {};
  ["source", "ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
    const value = params.get(key);
    if (value) captured[key] = value;
  });
  return captured;
}

export default function FoundingFamiliesSignupPage() {
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [childFirstName, setChildFirstName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [ageTrack, setAgeTrack] = useState("");
  const [childShirtSize, setChildShirtSize] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [siblingInterest, setSiblingInterest] = useState(false);
  const [siblingFirstName, setSiblingFirstName] = useState("");
  const [siblingAge, setSiblingAge] = useState("");
  const [siblingShirtSize, setSiblingShirtSize] = useState("");
  const [referralNote, setReferralNote] = useState("");
  const [agreesToUpdates, setAgreesToUpdates] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUtm(getUtm());
  }, []);

  useEffect(() => {
    setAgeTrack(trackForAge(childAge));
  }, [childAge]);

  const canSubmit = useMemo(() => {
    return Boolean(
      parentFirstName.trim() &&
        parentLastName.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
        childFirstName.trim() &&
        childAge.trim() &&
        ageTrack &&
        childShirtSize &&
        shippingCity.trim() &&
        shippingState.trim() &&
        /^\d{5}$/.test(shippingZip.trim()) &&
        agreesToUpdates,
    );
  }, [
    ageTrack,
    agreesToUpdates,
    childAge,
    childFirstName,
    childShirtSize,
    email,
    parentFirstName,
    parentLastName,
    shippingCity,
    shippingState,
    shippingZip,
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    const eligible = isEligibleAge(childAge);
    const enrollment = {
      type: "hta_founding_family_enrollment",
      status: eligible ? "reserved" : "waitlisted",
      paymentStatus: "not_collected",
      offer: "hta-founding-families",
      publicPrice: basePrice,
      shipmentLanguage: "planned September shipment",
      family: {
        parentFirstName: parentFirstName.trim(),
        parentLastName: parentLastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      },
      child: {
        firstName: childFirstName.trim(),
        age: Number.parseInt(childAge, 10),
        ageTrack,
        shirtSize: childShirtSize,
      },
      shipping: {
        city: shippingCity.trim(),
        state: shippingState,
        zip: shippingZip.trim(),
      },
      siblingInterest: {
        selected: siblingInterest,
        firstName: siblingFirstName.trim(),
        age: siblingAge ? Number.parseInt(siblingAge, 10) : null,
        shirtSize: siblingShirtSize,
      },
      referralNote: referralNote.trim(),
      agreesToUpdates,
      source: {
        source: utm.source || "",
        ref: utm.ref || "",
        utmSource: utm.utm_source || "",
        utmMedium: utm.utm_medium || "",
        utmCampaign: utm.utm_campaign || "",
        utmContent: utm.utm_content || "",
        utmTerm: utm.utm_term || "",
      },
      capturedAt: new Date().toISOString(),
    };

    window.localStorage.setItem("hta_founding_families_reservation", JSON.stringify(enrollment));
    window.location.href = eligible
      ? "/hta/founding-families/reserved"
      : "/hta/founding-families/waitlist-confirmed";
  }

  return (
    <main className="min-h-screen bg-[#f6fbf7] text-[#102c43]">
      <section className="border-b border-[#d6e6df] bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-7 md:px-8">
          <Link href="/hta" className="inline-flex w-fit items-center gap-2 text-sm font-black text-[#179b57]">
            <ArrowLeft className="h-4 w-4" /> Home Team Academy
          </Link>
          <div className="grid gap-5 md:grid-cols-[1fr_360px]">
            <div>
              <p className="text-xs font-black uppercase text-[#179b57]">HTA Founding Families</p>
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
                Reserve your family&apos;s first soccer adventure box.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-[#405a6d]">
                Reserve the HTA Founding Families founder package: Welcome Box plus the first 3 monthly soccer adventure boxes for $196.
                First boxes are planned for September. No payment is collected today.
              </p>
            </div>
            <div className="rounded-md border border-[#d6e6df] bg-[#102c43] p-5 text-white">
              <div className="flex items-center gap-3">
                <PackageOpen className="h-6 w-6 text-[#66d38c]" />
                <p className="font-black">Founder package</p>
              </div>
              <p className="mt-4 text-4xl font-black">$196</p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#dcebf0]">Welcome Box + first 3 monthly soccer adventure boxes.</p>
              <p className="mt-4 rounded-md bg-white/10 px-3 py-2 text-sm font-bold text-[#ffdc4d]">No payment is collected today.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 md:grid-cols-[1fr_340px] md:px-8">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="rounded-md border border-[#d6e6df] bg-white p-5">
            <h2 className="text-xl font-black">Parent details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={parentFirstName} onChange={(e) => setParentFirstName(e.target.value)} placeholder="Parent first name" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
              <input value={parentLastName} onChange={(e) => setParentLastName(e.target.value)} placeholder="Parent last name" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Mobile optional" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
            </div>
          </div>

          <div className="rounded-md border border-[#d6e6df] bg-white p-5">
            <h2 className="text-xl font-black">Child adventure track</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={childFirstName} onChange={(e) => setChildFirstName(e.target.value)} placeholder="Child first name" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
              <input value={childAge} onChange={(e) => setChildAge(e.target.value)} inputMode="numeric" placeholder="Child age" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
              <select value={ageTrack} onChange={(e) => setAgeTrack(e.target.value)} className="min-h-12 rounded-md border border-[#b8d7e7] px-4">
                <option value="">Choose age track</option>
                <option>Little Champions</option>
                <option>Skills Squad</option>
                <option>Waitlist</option>
              </select>
              <select value={childShirtSize} onChange={(e) => setChildShirtSize(e.target.value)} className="min-h-12 rounded-md border border-[#b8d7e7] px-4">
                <option value="">Child shirt size</option>
                {shirtSizes.map((size) => <option key={size}>{size}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-md border border-[#d6e6df] bg-white p-5">
            <h2 className="text-xl font-black">Shipping area</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#405a6d]">We only need city, state, and ZIP while this is a reservation. Full address comes later when checkout opens.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <input value={shippingCity} onChange={(e) => setShippingCity(e.target.value)} placeholder="City" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
              <select value={shippingState} onChange={(e) => setShippingState(e.target.value)} className="min-h-12 rounded-md border border-[#b8d7e7] px-4">
                <option value="">State</option>
                {states.map((state) => <option key={state}>{state}</option>)}
              </select>
              <input value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} inputMode="numeric" placeholder="ZIP" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
            </div>
          </div>

          <div className="rounded-md border border-[#d6e6df] bg-white p-5">
            <label className="flex cursor-pointer items-start gap-3">
              <input checked={siblingInterest} onChange={(e) => setSiblingInterest(e.target.checked)} type="checkbox" className="mt-1 h-5 w-5 accent-[#179b57]" />
              <span>
                <span className="block font-black">I may want a sibling kit later</span>
                <span className="mt-1 block text-sm leading-6 text-[#405a6d]">We are collecting sibling interest only. No sibling kit price or payment is offered yet.</span>
              </span>
            </label>
            {siblingInterest && (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <input value={siblingFirstName} onChange={(e) => setSiblingFirstName(e.target.value)} placeholder="Sibling first name" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
                <input value={siblingAge} onChange={(e) => setSiblingAge(e.target.value)} inputMode="numeric" placeholder="Age" className="min-h-12 rounded-md border border-[#b8d7e7] px-4" />
                <select value={siblingShirtSize} onChange={(e) => setSiblingShirtSize(e.target.value)} className="min-h-12 rounded-md border border-[#b8d7e7] px-4">
                  <option value="">Shirt size</option>
                  {shirtSizes.map((size) => <option key={size}>{size}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="rounded-md border border-[#d6e6df] bg-white p-5">
            <textarea value={referralNote} onChange={(e) => setReferralNote(e.target.value)} placeholder="Anything helpful for Corinne's team? Optional." className="min-h-28 w-full rounded-md border border-[#b8d7e7] p-4" />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#d6e6df] bg-white p-5">
            <input checked={agreesToUpdates} onChange={(e) => setAgreesToUpdates(e.target.checked)} type="checkbox" className="mt-1 h-5 w-5 accent-[#179b57]" />
            <span className="text-sm font-bold leading-6 text-[#405a6d]">
              I agree to receive HTA production, shipment, and checkout updates for this reservation.
            </span>
          </label>

          <button disabled={!canSubmit || saving} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-[#179b57] px-6 py-4 text-sm font-black text-white enabled:hover:bg-[#127f48] disabled:cursor-not-allowed disabled:bg-[#9fcdb3]">
            {saving ? "Saving reservation..." : "Reserve Your Founding Family Spot"} <ClipboardCheck className="h-4 w-4" />
          </button>
          <p className="text-center text-sm font-bold leading-6 text-[#405a6d]">
            You will be invited to complete checkout once shipment details and refund rules are finalized.
          </p>
        </form>

        <aside className="h-fit rounded-md border border-[#d6e6df] bg-white p-5 shadow-[0_18px_40px_rgba(16,44,67,0.08)] md:sticky md:top-5">
          <p className="text-xs font-black uppercase text-[#179b57]">Reservation summary</p>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-4"><span>HTA Founding Families</span><strong>${basePrice}</strong></div>
            <div className="border-t border-[#d6e6df] pt-3 font-black">Payment today: $0</div>
          </div>
          <div className="mt-5 grid gap-3">
            {[
              "Welcome Box + first 3 monthly soccer adventure boxes.",
              "Little Champions for ages 3-5 or Skills Squad for ages 6-8.",
              "First boxes planned for September.",
              "No full shipping address, parent shirt, sibling payment, or Stripe checkout yet.",
            ].map((copy) => (
              <div key={copy} className="flex gap-2 text-sm font-bold leading-6 text-[#405a6d]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-[#179b57]" />
                <span>{copy}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md bg-[#f6fbf7] p-4">
            <div className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4 text-[#179b57]" /> Payment guardrail</div>
            <p className="mt-2 text-sm leading-6 text-[#405a6d]">Checkout opens only after production, shipping, support, and refund rules are ready.</p>
          </div>
          <Link href="/worldcup" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#14324a] underline decoration-[#9fd6b6] decoration-2 underline-offset-4">
            Get the free World Cup bracket <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </section>
    </main>
  );
}
