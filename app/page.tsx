import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <h1 className="text-xl font-bold">Business Management Platform</h1>
        <nav>
          <Link 
            href="/sign-in" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Sign In
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-4xl font-extrabold mb-4">Streamline Your Operations</h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          A robust, multi-tenant solution to handle Point of Sale (POS), Inventory, CRM, Debts, and Analytics for both Retail and Service-based businesses.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/sign-in" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link 
            href="/dashboard" 
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            View Dashboard
          </Link>
        </div>
      </main>

      <footer className="p-6 text-center text-sm text-gray-500 border-t">
        &copy; {new Date().getFullYear()} Business Platform. All rights reserved.
      </footer>
    </div>
  );
}
