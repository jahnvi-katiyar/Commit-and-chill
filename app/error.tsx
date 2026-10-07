'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f7fb] px-5">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-slate-500">An unexpected error occurred. Your data is safe — try again.</p>
        <button onClick={reset} className="mt-6 h-12 rounded-xl bg-[#7657f6] px-6 font-semibold text-white transition hover:bg-[#6647e9]">Try again</button>
      </div>
    </main>
  )
}
