
"use client";
import Link from "next/link";
import Booth from "./vintage/Booth";

export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-700 mb-4">Vintage Photo Booth (Online)</h1>
      <Booth />
      <footer className="mt-10 text-sm text-gray-600">
        Need a peer server? See the README and set <code>NEXT_PUBLIC_PEER_SERVER</code>.
      </footer>
    </main>
  );
}
