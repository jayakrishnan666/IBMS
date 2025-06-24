import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-[#18181b] dark:to-[#23272f] flex flex-col items-center p-6 sm:p-12">
      {/* Header */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
        <div className="flex items-center gap-3">
          <Image src="/next.svg" alt="Logo" width={48} height={48} />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Inventory & Billing Management
          </h1>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-300 font-mono">Welcome, Admin</span>
      </header>

      {/* Dashboard Cards */}
      <main className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Inventory */}
        <Link href="/inventory" className="group bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform border border-gray-100 dark:border-zinc-800">
          <Image src="/file.svg" alt="Inventory" width={40} height={40} className="mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Inventory</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">Manage products, stock levels, and categories.</p>
        </Link>
        {/* Billing */}
        <Link href="/billing" className="group bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform border border-gray-100 dark:border-zinc-800">
          <Image src="/vercel.svg" alt="Billing" width={40} height={40} className="mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Billing</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">Create invoices, process payments, and track sales.</p>
        </Link>
        {/* Customers */}
        <Link href="/customers" className="group bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform border border-gray-100 dark:border-zinc-800">
          <Image src="/window.svg" alt="Customers" width={40} height={40} className="mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Customers</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">View and manage customer information and history.</p>
        </Link>
        {/* Reports */}
        <Link href="/reports" className="group bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform border border-gray-100 dark:border-zinc-800">
          <Image src="/globe.svg" alt="Reports" width={40} height={40} className="mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Reports</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">Analyze sales, inventory, and billing reports.</p>
        </Link>
        {/* Settings */}
        <Link href="/settings" className="group bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-transform border border-gray-100 dark:border-zinc-800">
          <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mb-4 group-hover:scale-110 transition-transform text-gray-700 dark:text-gray-200"><path stroke="currentColor" strokeWidth="1.5" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"/><path stroke="currentColor" strokeWidth="1.5" d="M19.5 12c0-.563.06-1.11.174-1.634a1.5 1.5 0 0 0-.364-1.47l-1.06-1.06a1.5 1.5 0 0 1-.364-1.47c.114-.524.174-1.07.174-1.634s-.06-1.11-.174-1.634a1.5 1.5 0 0 1 .364-1.47l1.06-1.06a1.5 1.5 0 0 0 .364-1.47A8.01 8.01 0 0 0 12 2.5c-.563 0-1.11.06-1.634.174a1.5 1.5 0 0 0-1.47.364l-1.06 1.06a1.5 1.5 0 0 1-1.47.364A8.01 8.01 0 0 0 4.5 6.5c0 .563.06 1.11.174 1.634a1.5 1.5 0 0 1-.364 1.47l-1.06 1.06a1.5 1.5 0 0 0-.364 1.47c-.114.524-.174 1.07-.174 1.634s.06 1.11.174 1.634a1.5 1.5 0 0 0 .364 1.47l1.06 1.06a1.5 1.5 0 0 1 .364 1.47A8.01 8.01 0 0 0 12 21.5c.563 0 1.11-.06 1.634-.174a1.5 1.5 0 0 1 1.47-.364l1.06-1.06a1.5 1.5 0 0 0 1.47-.364A8.01 8.01 0 0 0 19.5 17.5c0-.563-.06-1.11-.174-1.634a1.5 1.5 0 0 1 .364-1.47l1.06-1.06a1.5 1.5 0 0 0 .364-1.47c.114-.524.174-1.07.174-1.634Z"/></svg>
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Settings</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">Configure system preferences and user accounts.</p>
        </Link>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} Inventory & Billing Management System. All rights reserved.
      </footer>
    </div>
  );
}
