import { Link } from "react-router";
import {
  Camera,
  Gauge,
  ListChecks,
  FileWarning,
  Images,
  Film,
  Copy,
  Clock,
  Check,
  X,
  Star,
  Mail,
  Menu,
  User,
  KeyRound,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ScoreGauge from "@/components/ScoreGauge";

/* ---------------------------------- nav ---------------------------------- */

const NAV = [
  { label: "The problem", href: "#problem" },
  { label: "How it works", href: "#how" },
  { label: "Compare", href: "#compare" },
  { label: "For agencies", href: "#agencies" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

function SignInMenu({ fullWidth = false }: { fullWidth?: boolean }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return (
      <Button
        asChild
        className={`rounded-full bg-brand-gradient font-semibold text-white shadow-soft hover:opacity-90 ${fullWidth ? "w-full" : ""}`}
      >
        <Link to="/dashboard">Open dashboard</Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={`rounded-full bg-brand-gradient font-semibold text-white shadow-soft hover:opacity-90 ${fullWidth ? "w-full" : ""}`}
        >
          Sign in
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/login" className="flex items-center">
            <User className="mr-2 h-4 w-4 text-brand-teal" /> Agent / inspector login
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/login" className="flex items-center">
            <KeyRound className="mr-2 h-4 w-4 text-brand-blue" /> Property owner login
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/90 shadow-soft backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-2.5">
          <img src="/brand/propcheq-icon-512.png" alt="Propcheq" className="h-9 w-9 rounded-[10px]" />
          <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">Propcheq</span>
        </a>
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm font-medium text-[#334155] hover:text-brand-teal">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden lg:block">
          <SignInMenu />
        </div>
        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          <Menu className="h-6 w-6 text-[#0F172A]" />
        </button>
      </div>
      {open && (
        <div className="border-t border-[#E2E8F0] bg-white px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-[#334155]"
              >
                {n.label}
              </a>
            ))}
            <SignInMenu fullWidth />
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------ phone mockup ------------------------------ */

function FeedCard({
  img,
  area,
  caption,
  time,
  tone,
}: {
  img: string;
  area: string;
  caption: string;
  time: string;
  tone: "good" | "warn";
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-soft">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="rounded-full bg-brand-gradient px-2.5 py-0.5 text-[10px] font-semibold text-white">
          {area}
        </span>
        <span className="ml-auto text-[10px] text-[#64748B]">{time}</span>
      </div>
      <img src={img} alt={area} className="aspect-[4/3] w-full object-cover" />
      <div className="flex items-start gap-2 px-3 py-2">
        {tone === "good" ? (
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good" />
        ) : (
          <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
        )}
        <p className="text-[11px] leading-snug text-[#334155]">{caption}</p>
      </div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[300px] rounded-[36px] border-[10px] border-[#0F172A] bg-[#F8FAFC] shadow-2xl">
      <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-[#0F172A]" />
      <div className="max-h-[520px] space-y-3 overflow-hidden px-3 pb-6 pt-10">
        <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-soft">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#64748B]">
              Property score
            </p>
            <p className="text-xs font-semibold text-[#0F172A]">2/10 Hillcrest Road</p>
          </div>
          <ScoreGauge score={87} size={64} />
        </div>
        <FeedCard
          img="/brand/demo-kitchen.jpg"
          area="Kitchen"
          caption="Benchtop and cabinetry clean, appliances working. No issues."
          time="10:42 am"
          tone="good"
        />
        <FeedCard
          img="/brand/demo-exterior.jpg"
          area="Exterior"
          caption="Front lawn needs attention before next inspection."
          time="10:51 am"
          tone="warn"
        />
      </div>
    </div>
  );
}

/* -------------------------------- sections -------------------------------- */

const PROBLEMS = [
  {
    icon: FileWarning,
    title: "Reports nobody reads",
    body: "Static Word-template PDFs bury the important stuff. Owners wade through pages of tables to find the two things that actually need attention.",
  },
  {
    icon: Copy,
    title: "Double handling",
    body: "Inspectors photograph on a phone, transfer files, then embed them into a document back at the office. Every report is done twice.",
  },
  {
    icon: Images,
    title: "Squashed, lifeless photos",
    body: "Images crammed into document tables shrink to thumbnails and lose the detail that proves a property's condition.",
  },
  {
    icon: Film,
    title: "No video, no voice",
    body: "A dripping tap or a sticking door can't be shown in a still. Legacy templates can't capture or display video at all.",
  },
  {
    icon: Clock,
    title: "Slow follow-up",
    body: "Action items hide in paragraph six. Weeks pass before anyone acts — if they act at all.",
  },
  {
    icon: Gauge,
    title: "No at-a-glance verdict",
    body: "There's no score, no summary, no way for an owner to know 'is my property okay?' in five seconds.",
  },
];

const STEPS = [
  {
    icon: Camera,
    step: "1",
    title: "Capture like a feed",
    body: "Walk the property and snap photos or video in a familiar, Instagram-style flow. Auto-suggested descriptions and one-tap phrases mean almost no typing on site.",
  },
  {
    icon: Gauge,
    step: "2",
    title: "Rate as you go",
    body: "Quick sliders score cleanliness, condition and more. Propcheq rolls them into a single property score out of 100 — an instant verdict.",
  },
  {
    icon: ListChecks,
    step: "3",
    title: "Share a living report",
    body: "The owner gets a private, scrollable report page: full-quality media, a ratings dashboard, and clear action points they can respond to in one tap.",
  },
];

const COMPARE: { feature: string; word: boolean; propcheq: boolean | string }[] = [
  { feature: "Capture photos & video during the inspection", word: false, propcheq: true },
  { feature: "Auto-suggested media descriptions", word: false, propcheq: true },
  { feature: "Full-resolution, zoomable media", word: false, propcheq: true },
  { feature: "Property score out of 100", word: false, propcheq: true },
  { feature: "Scrollable, feed-style report owners enjoy reading", word: false, propcheq: true },
  { feature: "Action points with one-tap owner responses", word: false, propcheq: true },
  { feature: "No double handling — report builds itself as you inspect", word: false, propcheq: true },
  { feature: "Works with the tools agents already know", word: true, propcheq: true },
];

const PLANS = [
  {
    name: "Solo",
    price: "$29",
    unit: "AUD / month",
    blurb: "For independent inspectors and single-property managers.",
    features: ["1 inspector seat", "Up to 25 properties", "Unlimited reports", "Photo & video capture", "Property score & dashboard", "Owner report pages"],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Agency",
    price: "$79",
    unit: "AUD / month",
    blurb: "For property management teams that want reports to be a selling point.",
    features: ["5 inspector seats", "Up to 150 properties", "Everything in Solo", "Action requests & owner responses", "Agency-branded report pages", "Priority support"],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Portfolio",
    price: "$179",
    unit: "AUD / month",
    blurb: "For larger rent rolls and multi-office agencies.",
    features: ["Unlimited inspector seats", "500+ properties", "Everything in Agency", "Custom templates & clauses", "Onboarding & training", "Dedicated account manager"],
    cta: "Talk to us",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Owners used to skim our PDFs and miss the important items. With Propcheq they open the report, see the score, and action things the same day.",
    name: "Sarah Mitchell",
    role: "Senior Property Manager, boutique agency — Perth WA",
  },
  {
    quote:
      "The feed format just makes sense. I inspected a 4x2 in under 25 minutes and the report was finished when I walked out the door.",
    name: "Daniel O'Connor",
    role: "Independent property inspector",
  },
  {
    quote:
      "As a landlord interstate, I finally feel like I can see my property. The photos are full quality and the action list tells me exactly what to approve.",
    name: "Priya Nair",
    role: "Property owner, 3 investment properties",
  },
];

function SectionHeading({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-teal">{kicker}</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-base text-[#64748B]">{sub}</p>}
    </div>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function Landing() {
  return (
    <div id="top" className="min-h-screen bg-white font-sans">
      <LandingNav />

      {/* Hero */}
      <section className="overflow-hidden bg-[#F8FAFC]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-block rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white">
              Photo-first property inspections
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-[#0F172A] sm:text-5xl">
              Property inspections, <span className="bg-brand-gradient bg-clip-text text-transparent">in focus.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-[#334155]">
              Propcheq replaces dull Word-template reports with a scrollable, Instagram-style report —
              full-quality photos and video, a property score out of 100, and action points owners can
              respond to in one tap.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-brand-gradient px-7 font-semibold text-white shadow-soft hover:opacity-90">
                <Link to="/login">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7 font-semibold">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-[#64748B]">14-day free trial · No credit card · Owners always free</p>
          </div>
          <PhoneMockup />
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          kicker="The problem"
          title="Inspection reports are stuck in 2005"
          sub="The industry standard is a Word template exported to PDF. It fails inspectors in the field and owners at the kitchen table."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <p.icon className="h-5 w-5 text-bad" />
              </div>
              <h3 className="mt-4 font-bold text-[#0F172A]">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[#F8FAFC] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            kicker="How it works"
            title="As easy as posting to your feed"
            sub="If you can use Instagram, you can run a Propcheq inspection. The report builds itself as you walk the property."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient">
                    <s.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-4xl font-extrabold text-[#E2E8F0]">{s.step}</span>
                </div>
                <h3 className="mt-4 font-bold text-[#0F172A]">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compare */}
      <section id="compare" className="mx-auto max-w-4xl px-4 py-20">
        <SectionHeading
          kicker="Why switch"
          title="Propcheq vs the Word template"
          sub="Everything the old format can't do — built in from day one."
        />
        <div className="mt-12 overflow-hidden rounded-2xl border border-[#E2E8F0] shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] text-left">
                <th className="px-5 py-3.5 font-semibold text-[#334155]">Capability</th>
                <th className="w-28 px-3 py-3.5 text-center font-semibold text-[#64748B]">Word / PDF</th>
                <th className="w-28 px-3 py-3.5 text-center font-semibold text-brand-blue">Propcheq</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr key={row.feature} className={i % 2 ? "bg-[#F8FAFC]/60" : "bg-white"}>
                  <td className="px-5 py-3 text-[#334155]">{row.feature}</td>
                  <td className="px-3 py-3 text-center">
                    {row.word ? (
                      <Check className="mx-auto h-4 w-4 text-[#64748B]" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-bad" />
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <Check className="mx-auto h-4 w-4 text-good" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Agencies */}
      <section id="agencies" className="bg-brand-gradient py-20 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/80">For agencies</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Your reports are your shopfront
              </h2>
              <p className="mt-4 text-white/90">
                Every agency sends the same tired PDF. When your report looks and feels like a modern
                app — scored, scrollable, effortless — landlords notice. Propcheq turns a routine
                compliance task into the thing that wins you managements and keeps owners loyal.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Win new landlords with reports that demo themselves",
                "Owners feel informed — fewer anxious phone calls",
                "Action points get answered in-app, not lost in email",
                "A premium, agency-branded experience at no extra effort",
                "Inspectors finish reports on-site — no office overtime",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          kicker="Pricing"
          title="Simple plans, owners always free"
          sub="Every plan includes unlimited reports, full-quality photo and video, and the property score. 14-day free trial on all plans."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 shadow-soft ${
                plan.highlight ? "border-brand-blue ring-2 ring-brand-blue" : "border-[#E2E8F0]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-1 text-xs font-bold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-[#0F172A]">{plan.name}</h3>
              <p className="mt-1 text-sm text-[#64748B]">{plan.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-[#0F172A]">{plan.price}</span>
                <span className="text-sm text-[#64748B]">{plan.unit}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#334155]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 rounded-full font-semibold ${
                  plan.highlight
                    ? "bg-brand-gradient text-white hover:opacity-90"
                    : "bg-[#0F172A] text-white hover:bg-[#1E293B]"
                }`}
              >
                {plan.cta === "Talk to us" ? (
                  <a href="mailto:hello@propcheq.com">{plan.cta}</a>
                ) : (
                  <Link to="/login">{plan.cta}</Link>
                )}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-[#64748B]">
          Property owners never pay — they access reports through a free owner account.
        </p>
      </section>

      {/* Testimonials */}
      <section className="bg-[#F8FAFC] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading kicker="Testimonials" title="Loved by inspectors and owners" />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-soft">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-[#334155]">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-[#E2E8F0] pt-4">
                  <p className="text-sm font-bold text-[#0F172A]">{t.name}</p>
                  <p className="text-xs text-[#64748B]">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / footer */}
      <footer id="contact" className="bg-[#0F172A] py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/brand/propcheq-icon-512.png" alt="" className="h-9 w-9 rounded-[10px]" />
                <span className="text-xl font-extrabold tracking-tight">Propcheq</span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-white/70">
                Property inspections, in focus. Photo-first reports that owners actually read.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Contact</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a href="mailto:hello@propcheq.com" className="inline-flex items-center gap-2 text-white/85 hover:text-white">
                    <Mail className="h-4 w-4 text-brand-teal" /> hello@propcheq.com — sales & general
                  </a>
                </li>
                <li>
                  <a href="mailto:support@propcheq.com" className="inline-flex items-center gap-2 text-white/85 hover:text-white">
                    <Mail className="h-4 w-4 text-brand-teal" /> support@propcheq.com — help & support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Get started</h4>
              <div className="mt-4 flex flex-col items-start gap-3">
                <Button asChild className="rounded-full bg-brand-gradient font-semibold text-white hover:opacity-90">
                  <Link to="/login">Start free trial</Link>
                </Button>
                <div className="flex gap-4 text-sm text-white/85">
                  <Link to="/login" className="hover:text-white">Agent login</Link>
                  <Link to="/login" className="hover:text-white">Owner login</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/50">
            © {new Date().getFullYear()} Propcheq · propcheq.com
          </div>
        </div>
      </footer>
    </div>
  );
}
