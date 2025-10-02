'use client';

import { api } from '@/lib/trpc';

export default function Home() {
  const { data: ping, isLoading } = api.health.ping.useQuery();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          IT Project Management Platform
        </h1>

        <div className="bg-white/10 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : ping ? (
            <div className="space-y-2">
              <p className="text-success">✓ API: {ping.message}</p>
              <p className="text-sm text-gray-600">
                Timestamp: {ping.timestamp}
              </p>
            </div>
          ) : (
            <p className="text-danger">✗ API connection failed</p>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-300 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Tech Stack</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>• Next.js 14 (App Router)</li>
              <li>• tRPC 10</li>
              <li>• Prisma 5</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
            </ul>
          </div>

          <div className="border border-gray-300 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Quick Links</h3>
            <ul className="text-sm space-y-1">
              <li>
                <a href="/budget-pools" className="text-blue-600 hover:underline">
                  → Budget Pool Management
                </a>
              </li>
              <li className="text-gray-400">→ Project Tracking (Coming Soon)</li>
              <li className="text-gray-400">→ Proposal Approval (Coming Soon)</li>
              <li className="text-gray-400">→ Vendor & Procurement (Coming Soon)</li>
              <li className="text-gray-400">→ Expense Management (Coming Soon)</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
