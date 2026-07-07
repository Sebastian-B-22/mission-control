"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Brain,
  ChevronRight,
  Compass,
  Mail,
  PackageOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type FormState = "idle" | "saving" | "saved" | "error";

const kitDetails = [
  { icon: PackageOpen, title: "Real-world materials", copy: "Delivered monthly with simple gear, easy prompts, and short weekly challenges families can actually use." },
  { icon: Brain, title: "Built for sports development", copy: "Coordination, motor skills, confidence, and decision-making through active parent-child play." },
  { icon: Compass, title: "Story-led missions", copy: "Kids follow a theme instead of staring at a drill list." },
  { icon: ShieldCheck, title: "Parent guide", copy: "Show this, do this, say this - clear cues so you never have to guess." },
];

const ageTracks = [
  {
    name: "Little Champions Club",
    ages: "Ages 3-5",
    lens: "Adventure Play",
    copy: "Pretend play, movement, and tiny ball moments with the person they most want to play with.",
  },
  {
    name: "Skills Squad",
    ages: "Ages 6-8",
    lens: "Skill Missions",
    copy: "Dribbling, passing, turns, and teamwork disguised as missions and family challenges.",
  },
];

const futureTracks = [
  {
    name: "Performance Players",
    ages: "Ages 9-12",
    lens: "Game IQ + Confidence",
    copy: "Sharper skills, decision-making, athleticism, and resilient competitor identity.",
  },
  {
    name: "Athlete Academy",
    ages: "Ages 13-15",
    lens: "Performance + Leadership",
    copy: "Serious athlete habits, strength, speed, mindset, and leadership at home.",
  },
];

const quickFacts = [
  ["Best for", "Ages 3-5 and 6-8 first, with 9-12 coming soon"],
  ["Time needed", "15-20 minutes, 2-3 times per week"],
  ["Where", "Backyard, driveway, park, or living room"],
  ["Parent role", "Read the cue, play along, cheer them on"],
  ["Founder offer", "$196 Welcome Box + first 3 monthly adventure boxes"],
];

const faqs = [
  {
    question: "Do I need to know soccer?",
    answer: "No. HTA is built so parents can read the cue, model the first tiny step, and play along without needing a coaching background.",
  },
  {
    question: "How long does each activity take?",
    answer: "Each weekly mission set starts around 15 minutes total. Families can repeat favorite challenges when kids want more.",
  },
  {
    question: "Do we need special equipment?",
    answer: "The first missions are built around simple spaces and basic soccer gear. The founding-family box will add the physical pieces that make it feel like an adventure.",
  },
  {
    question: "What ages is this for?",
    answer: "The first launch is focused on Little Champions Club for ages 3-5 and Skills Squad for ages 6-8.",
  },
  {
    question: "Is this a class or private coaching?",
    answer: "No. It is an at-home family adventure, not another weekly class, clinic, or private lesson.",
  },
  {
    question: "When does it launch?",
    answer: "The first soccer box is still in development. Join the first-look list if you want an update when the first box launches.",
  },
];

export default function HTALandingPage() {
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kidsAge, setKidsAge] = useState("");
  const [state, setState] = useState<FormState>("idle");

  const canSubmit = useMemo(() => {
    return parentName.trim().length > 1 && (email.trim().length > 4 || phone.trim().length > 6);
  }, [email, parentName, phone]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setState("saving");
    try {
      const response = await fetch("https://harmless-salamander-44.convex.site/worldcup/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "hta-coming-soon",
          mode: "launch-list",
          family: {
            familyName: parentName.trim() || "HTA Interest List",
            parentName: parentName.trim(),
            parentEmail: email.trim(),
            parentPhone: phone.trim(),
            textOptIn: false,
            htaLaunchOptIn: true,
          },
          entry: {
            interestedAt: new Date().toISOString(),
            kidsAge: kidsAge.trim(),
            page: "hometeamacademy.com",
          },
        }),
      });

      if (!response.ok) throw new Error(await response.text());
      setState("saved");
      setParentName("");
      setEmail("");
      setPhone("");
      setKidsAge("");
    } catch {
      setState("error");
    }
  }

  return (
    <main id="content" className="hta-page min-h-screen bg-[#f6fbf7] text-[#102c43]">
      <a
        href="#interest"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-black focus:text-[#102c43] focus:shadow-lg"
      >
        Skip to signup
      </a>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hta-page {
          font-family: "Avenir Next", "Nunito Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            repeating-linear-gradient(90deg, rgba(23, 50, 77, 0.025) 0 1px, transparent 1px 72px),
            linear-gradient(180deg, #f6fbf7 0%, #ffffff 46%, #f4fbff 100%);
        }

        .hta-page h1,
        .hta-page h2,
        .hta-page h3 {
          text-wrap: balance;
        }

        .hta-page p {
          text-wrap: pretty;
        }

        .hta-page [class*="tracking-"] {
          letter-spacing: 0;
        }

        .hta-page a,
        .hta-page button {
          transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
        }

        .hta-page a:hover,
        .hta-page button:not(:disabled):hover {
          transform: translateY(-1px);
        }

        .hta-page a:active,
        .hta-page button:not(:disabled):active {
          transform: translateY(0);
        }

        .hta-page a:focus-visible,
        .hta-page button:focus-visible,
        .hta-page input:focus-visible {
          outline: 3px solid rgba(255, 220, 77, 0.9);
          outline-offset: 3px;
        }

        .hta-page :is(section div[class*="rounded-md"][class*="border"]) {
          animation: hta-rise 520ms ease;
          transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease, background-color 220ms ease;
        }

        .hta-page :is(section div[class*="rounded-md"][class*="border"]):nth-of-type(2n) {
          animation-delay: 70ms;
        }

        .hta-page :is(section div[class*="rounded-md"][class*="border"]):nth-of-type(3n) {
          animation-delay: 130ms;
        }

        @media (hover: hover) {
          .hta-page :is(section div[class*="rounded-md"][class*="border"]):hover {
            transform: translateY(-3px);
            border-color: rgba(23, 155, 87, 0.42);
            box-shadow: 0 18px 38px rgba(16, 44, 67, 0.12);
          }

          .hta-page :is(section div[class*="rounded-md"][class*="border"]):hover svg {
            transform: rotate(-4deg) scale(1.04);
          }
        }

        .hta-page :is(section div[class*="rounded-md"][class*="border"]):active {
          transform: scale(0.99);
        }

        .hta-page svg {
          transition: transform 220ms ease;
        }

        .hta-page .hta-logo-mark {
          animation: hta-float 5.8s ease-in-out infinite !important;
        }

        .hta-page .hta-mission-card {
          animation: hta-float 6.4s ease-in-out infinite !important;
        }

        .hta-page .hta-kit-chip {
          animation: hta-soft-pop 4.8s ease-in-out infinite !important;
        }

        .hta-page .hta-kit-chip:nth-child(2) {
          animation-delay: 180ms;
        }

        .hta-page .hta-kit-chip:nth-child(3) {
          animation-delay: 360ms;
        }

        .hta-page .hta-kit-chip:nth-child(4) {
          animation-delay: 540ms;
        }

        .hta-page .hta-path-card {
          animation: hta-rise 620ms ease both;
        }

        .hta-page .hta-path-card:nth-child(2) {
          animation-delay: 80ms;
        }

        .hta-page .hta-path-card:nth-child(3) {
          animation-delay: 160ms;
        }

        .hta-page .hta-path-card:nth-child(4) {
          animation-delay: 240ms;
        }

        .hta-page .hta-detail-card {
          animation: hta-card-breathe 6.6s ease-in-out infinite !important;
        }

        .hta-page .hta-detail-card:nth-child(2) {
          animation-delay: 220ms !important;
        }

        .hta-page .hta-detail-card:nth-child(3) {
          animation-delay: 440ms !important;
        }

        .hta-page .hta-detail-card:nth-child(4) {
          animation-delay: 660ms !important;
        }

        .hta-page .hta-path-card {
          animation: hta-card-breathe 7.2s ease-in-out infinite !important;
        }

        .hta-page .hta-badge-pulse {
          animation: hta-badge-pulse 2.4s ease-in-out infinite;
        }

        .hta-page .hta-feature-panel {
          animation: hta-panel-drift 9s ease-in-out infinite !important;
          will-change: transform;
        }

        @media (hover: hover) {
          .hta-page .hta-feature-panel:hover {
            transform: translateY(-5px) scale(1.01);
            box-shadow: 0 30px 76px rgba(16, 44, 67, 0.26);
          }

          .hta-page .hta-feature-panel:hover .hta-mission-card {
            animation: none !important;
            transform: translateY(-14px) rotate(-1.5deg) !important;
          }

          .hta-page .hta-feature-panel:hover .hta-kit-chip:nth-child(1) {
            animation: none !important;
            transform: translate(-5px, -7px) rotate(-1deg) !important;
          }

          .hta-page .hta-feature-panel:hover .hta-kit-chip:nth-child(2) {
            animation: none !important;
            transform: translate(5px, -9px) rotate(1deg) !important;
          }

          .hta-page .hta-feature-panel:hover .hta-kit-chip:nth-child(3) {
            animation: none !important;
            transform: translate(-4px, 7px) rotate(1deg) !important;
          }

          .hta-page .hta-feature-panel:hover .hta-kit-chip:nth-child(4) {
            animation: none !important;
            transform: translate(4px, 8px) rotate(-1deg) !important;
          }
        }

        @keyframes hta-rise {
          from {
            opacity: 0.78;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes hta-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes hta-soft-pop {
          0%, 100% {
            transform: translateY(0);
            border-color: rgba(255, 255, 255, 0.15);
          }
          50% {
            transform: translateY(-6px);
            border-color: rgba(102, 211, 140, 0.45);
          }
        }

        .hta-page .hta-motion-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .hta-page .hta-motion-strip span {
          height: 6px;
          border-radius: 999px;
          background: rgba(102, 211, 140, 0.28);
          animation: hta-trail 1.8s ease-in-out infinite;
        }

        .hta-page .hta-motion-strip span:nth-child(2) {
          animation-delay: 140ms;
        }

        .hta-page .hta-motion-strip span:nth-child(3) {
          animation-delay: 280ms;
        }

        .hta-page .hta-motion-strip span:nth-child(4) {
          animation-delay: 420ms;
        }

        @keyframes hta-trail {
          0%, 100% {
            transform: scaleX(0.45);
            background: rgba(102, 211, 140, 0.26);
          }
          50% {
            transform: scaleX(1);
            background: rgba(255, 220, 77, 0.86);
          }
        }

        @keyframes hta-card-breathe {
          0%, 100% {
            transform: translateY(0);
            box-shadow: 0 0 0 rgba(16, 44, 67, 0);
          }
          50% {
            transform: translateY(-4px);
            box-shadow: 0 14px 30px rgba(16, 44, 67, 0.12);
          }
        }

        @keyframes hta-badge-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }

        @keyframes hta-panel-drift {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hta-page *,
          .hta-page *::before,
          .hta-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `,
        }}
      />
      <section className="border-b border-[#d6e6df] bg-[#f9fcf8]">
        <div className="mx-auto grid min-h-[88vh] w-full max-w-7xl grid-cols-1 gap-8 px-5 py-5 md:grid-cols-[1.04fr_0.96fr] md:px-8 lg:px-10">
          <div className="flex min-h-[640px] flex-col justify-between gap-8">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Image
                  src="/worldcup/hta-logo.svg"
                  alt="Home Team Academy"
                  width={112}
                  height={112}
                  className="hta-logo-mark h-24 w-24 sm:h-28 sm:w-28"
                  priority
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#179b57]">Home Team Academy</p>
                  <p className="mt-1 text-sm font-bold text-[#5d7180]">Your home field advantage</p>
                </div>
              </div>
            </header>

            <div className="max-w-3xl">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9e2d4] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#179b57]">
                <Sparkles className="h-4 w-4" />
                Built by a coach (and a mom). Made for real family life.
              </p>
              <h1 className="text-4xl font-black leading-[0.98] text-[#0f2f48] sm:text-5xl lg:text-6xl xl:text-7xl">
                An at-home soccer adventure your family actually does together.
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-[#405a6d] sm:text-2xl sm:leading-9">
                Home Team Academy is a monthly sports adventure - real gear, simple missions, and a little friendly competition - that builds confidence and coordination during the window your child still wants you in the game. <strong className="font-black text-[#102c43]">Less screens. More backyard. Deeper connection.</strong>
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/hta/founding-families/signup"
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-md bg-[#179b57] px-6 py-4 text-sm font-black text-white transition hover:bg-[#127f48]"
                >
                  Join Founding Families <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <Link href="/worldcup" prefetch={false} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#14324a] underline decoration-[#9fd6b6] decoration-2 underline-offset-4">
                New here? Try our free World Cup challenge <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 border-t border-[#d6e6df] pt-5 sm:grid-cols-3">
              {[
                ["Physical first", "Real gear, a storybook, and mission cards you open together."],
                ["Less screens", "A small digital reward layer only where it helps."],
                ["Development-rich", "Ball familiarity, motor skills, confidence, and connection."],
              ].map(([title, copy]) => (
                <div key={title} className="min-h-24 rounded-md border border-[#d6e6df] bg-white px-4 py-4">
                  <p className="text-sm font-black text-[#102c43]">{title}</p>
                  <p className="mt-2 text-sm leading-5 text-[#5d7180]">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid content-center gap-5 py-4">
            <div className="hta-feature-panel overflow-hidden rounded-md border border-[#17324d] bg-[#17324d] text-white shadow-[0_24px_58px_rgba(16,44,67,0.20)]">
              <div className="grid gap-6 p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ffdc4d]">The first reveal</p>
                    <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">A first look inside the adventure.</h2>
                  </div>
                  <PackageOpen className="hta-logo-mark h-10 w-10 flex-none text-[#66d38c]" />
                </div>

                <div className="rounded-md border border-white/12 bg-[#f8fcff] p-4 text-[#102c43]">
                  <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                    <div className="hta-mission-card rounded-md border border-[#cfe7d9] bg-white p-4 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
                      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#179b57]">Mission card preview</p>
                      <h3 className="mt-2 text-2xl font-black leading-tight">Ultimate Shield Quest</h3>
                      <p className="mt-3 text-sm leading-6 text-[#405a6d]">Shield the ball from your grown-up. You have 9 lives - how long can you stay in the quest?</p>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-black text-[#14324a]">
                        <span className="rounded bg-[#e8f8ef] px-2 py-2">Read</span>
                        <span className="rounded bg-[#fff3bb] px-2 py-2">Try</span>
                        <span className="rounded bg-[#eaf6ff] px-2 py-2">Cheer</span>
                      </div>
                    </div>
                    <div className="rounded-md border border-white/20 bg-[#102c43] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#ffdc4d]">Opening kit mockup</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-black">
                        {["Adventure Story", "Mission Cards", "Parent Guide", "Real-World Materials"].map((item) => (
                          <span key={item} className="hta-kit-chip rounded-md border border-white/15 bg-white/10 px-3 py-3 text-white">{item}</span>
                        ))}
                      </div>
                      <div className="hta-motion-strip" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  {kitDetails.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="hta-detail-card grid grid-cols-[44px_1fr] gap-3 rounded-md border border-white/12 bg-white/7 p-4">
                        <div className="grid h-11 w-11 place-items-center rounded-md bg-[#66d38c] text-[#102c43]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[#dcebf0]">{item.copy}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-white/12 bg-[#0f2638] px-5 py-4 sm:px-7">
                <p className="text-sm font-bold leading-6 text-[#dcebf0]">
                  The goal is not to turn your living room into a training session. It is to make passing, tagging, laughing, and trying again feel like normal family life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-5 py-12 md:grid-cols-[1fr_1.08fr] md:px-8 lg:px-10">
          <div className="rounded-md border border-[#d6e6df] bg-[#f6fbf7] p-6">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#179b57]">What is HTA?</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-[#102c43] sm:text-4xl">An adventure in a box, not another app.</h2>
            <p className="mt-4 text-lg leading-8 text-[#405a6d]">
              Most soccer apps hand your kid a screen. We do the opposite. Every month brings a physical adventure you open together: real gear, a storybook, mission cards, an adventure map, and one short weekly mission set.
            </p>
          </div>
          <div className="rounded-md border border-[#d6e6df] bg-white p-6 shadow-[0_18px_40px_rgba(16,44,67,0.08)]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#179b57]">Quick facts</p>
            <div className="mt-5 grid gap-3">
              {quickFacts.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[112px_1fr] gap-3 rounded-md border border-[#e0ece7] bg-[#f9fcf8] px-4 py-3 text-sm">
                  <span className="font-black text-[#102c43]">{label}</span>
                  <span className="font-bold leading-6 text-[#405a6d]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-5 py-14 md:grid-cols-[0.9fr_1.1fr] md:px-8 lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#179b57]">Why HTA exists</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-[#102c43] sm:text-5xl">
              Kids do not need another class. They need more playful reps with you.
            </h2>
          </div>
          <div className="grid gap-5 text-lg leading-8 text-[#405a6d]">
            <p>
              Development starts at home: a touch, a turn, a chase, a laugh, a little challenge in the yard before dinner. Those small moments matter, and one short mission gives kids ideas they can keep replaying on their own.
            </p>
            <p>
              HTA turns coaching know-how into bite-size family missions: a story, a skill, a tiny challenge, and a clear parent cue. Enough structure to know where to start. Enough play to keep it fun.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d6e6df] bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-5 py-14 md:grid-cols-[0.85fr_1.15fr] md:px-8 lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#179b57]">Coach-designed</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-[#102c43] sm:text-5xl">
              Built from Corinne&apos;s years on the field, then simplified for parents.
            </h2>
          </div>
          <div className="grid gap-4">
            {[
              "Former professional and international player, coach, and homeschooling mom who knows what real development feels like.",
              "High-level coaching licenses and 25+ years coaching kids, teams, and youth programs.",
              "Parent-friendly coaching philosophy: confidence, connection, movement, and joy before pressure.",
            ].map((copy) => (
              <div key={copy} className="flex gap-3 rounded-md border border-[#d6e6df] bg-[#f6fbf7] p-4">
                <ShieldCheck className="mt-1 h-5 w-5 flex-none text-[#179b57]" />
                <p className="text-base font-bold leading-7 text-[#405a6d]">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#d6e6df] bg-[#f6fbf7]">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 md:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#179b57]">Player paths</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-[#102c43] sm:text-5xl">
              First launch: ages 3-5 and 6-8.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#405a6d]">
              HTA starts with the younger window, then expands into sharper home training for older players.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {ageTracks.map((track) => (
              <div key={track.name} className="hta-path-card rounded-md border border-[#d6e6df] bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#179b57]">{track.ages}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black leading-tight text-[#102c43]">{track.name}</h3>
                  <span className="hta-badge-pulse rounded bg-[#fff3bb] px-2 py-1 text-[11px] font-black uppercase text-[#7a5700]">Coming soon</span>
                </div>
                <p className="mt-2 text-sm font-black text-[#5d7180]">{track.lens}</p>
                <p className="mt-4 text-sm leading-6 text-[#405a6d]">{track.copy}</p>
              </div>
            ))}
            {futureTracks.map((track) => (
              <div key={track.name} className="hta-path-card rounded-md border border-[#b8d7e7] bg-[#f4fbff] p-5">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#1477a8]">{track.ages}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black leading-tight text-[#102c43]">{track.name}</h3>
                  <span className="hta-badge-pulse rounded bg-[#dff2ff] px-2 py-1 text-[11px] font-black uppercase text-[#105274]">Future track</span>
                </div>
                <p className="mt-2 text-sm font-black text-[#5d7180]">{track.lens}</p>
                <p className="mt-4 text-sm leading-6 text-[#405a6d]">{track.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#d6e6df] bg-white">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 md:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#179b57]">FAQ</p>
            <h2 className="mt-3 text-4xl font-black leading-tight text-[#102c43] sm:text-5xl">Simple answers for busy parents.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-md border border-[#d6e6df] bg-[#f6fbf7] p-5">
                <h3 className="text-lg font-black leading-tight text-[#102c43]">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-[#405a6d]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="interest" className="bg-[#102c43] text-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-5 py-14 md:grid-cols-[0.85fr_1.15fr] md:px-8 lg:px-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#66d38c]">First-look list</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Want an update when the first box launches?</h2>
            <p className="mt-5 text-lg leading-8 text-[#dcebf0]">
              Join the first wave now, or leave your details here if you only want launch updates and simple soccer-at-home ideas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-md border border-white/12 bg-white p-5 text-[#102c43] shadow-[0_22px_54px_rgba(0,0,0,0.24)] sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Parent name" className="min-h-12 rounded-md border border-[#b8d7e7] px-4 text-base outline-none focus:border-[#179b57]" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="min-h-12 rounded-md border border-[#b8d7e7] px-4 text-base outline-none focus:border-[#179b57]" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Mobile number optional" className="min-h-12 rounded-md border border-[#b8d7e7] px-4 text-base outline-none focus:border-[#179b57]" />
              <input value={kidsAge} onChange={(e) => setKidsAge(e.target.value)} placeholder="Kid age range optional" className="min-h-12 rounded-md border border-[#b8d7e7] px-4 text-base outline-none focus:border-[#179b57]" />
            </div>
            <button disabled={!canSubmit || state === "saving"} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#179b57] px-5 py-3 text-sm font-black text-white transition enabled:hover:bg-[#138349] disabled:cursor-not-allowed disabled:bg-[#9fcdb3]">
              {state === "saving" ? "Saving..." : "Get the First Look"} <Mail className="h-4 w-4" />
            </button>
            <p className="mt-3 text-xs leading-5 text-[#5d7180]">
              Low-pressure launch updates only. No spam - just the first reveal and simple family soccer ideas.
            </p>
            {state === "saved" && <p className="mt-3 text-sm font-bold text-[#138349]">Saved. You are on the HTA first-look list.</p>}
            {state === "error" && <p className="mt-3 text-sm font-bold text-[#c2410c]">That did not save. Try again in a minute.</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
