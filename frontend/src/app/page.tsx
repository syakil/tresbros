import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-brand-dark">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-sans text-sm flex flex-col gap-6">
        <h1 className="text-6xl font-display font-bold text-brand-cream">Tres Bros Caffè</h1>
        <p className="text-xl text-brand-sage">POS & Kitchen Display System</p>
        
        <div className="flex gap-4 mt-8">
          <Link href="/pos" className="bg-brand-olive text-brand-cream px-6 py-3 rounded-xl font-medium hover:-translate-y-1 transition duration-200 shadow-[0_4px_20px_rgba(75,90,58,0.4)]">
            Open POS
          </Link>
          <Link href="/kds" className="bg-brand-warm text-brand-cream px-6 py-3 rounded-xl font-medium hover:-translate-y-1 transition duration-200 shadow-[0_4px_20px_rgba(161,107,61,0.4)]">
            Open KDS
          </Link>
        </div>
      </div>
    </main>
  );
}
