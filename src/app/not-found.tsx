import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-7xl font-black text-indigo-600">404</p>
        <h1 className="mt-2 text-2xl font-bold">This page is not booked 🙂</h1>
        <Link href="/" className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white">Back home</Link>
      </div>
    </main>
  );
}
