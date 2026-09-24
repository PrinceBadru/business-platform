'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, MapPin, Users, Package, CreditCard, Contact, ShoppingCart, Receipt, Banknote, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTransition } from 'react';
import { switchAccount } from '@/modules/account/actions';

type Account = { id: string; name: string };

export function Sidebar({ accounts, activeAccountId }: { accounts: Account[], activeAccountId: string | null }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const activeAccount = accounts.find(a => a.id === activeAccountId);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Point of Sale", href: "/dashboard/checkout", icon: ShoppingCart },
    { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
    { name: "Debts", href: "/dashboard/debts", icon: Banknote },
    { name: "Customers", href: "/dashboard/customers", icon: Contact },
    { name: "Locations", href: "/dashboard/locations", icon: MapPin },
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "Inventory", href: "/dashboard/inventory", icon: Package },
    { name: "Suppliers", href: "/dashboard/suppliers", icon: Truck },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left truncate">
              {activeAccount?.name || "Select Account"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {accounts.map(acc => (
              <DropdownMenuItem 
                key={acc.id}
                onClick={() => startTransition(() => switchAccount(acc.id))}
                className="cursor-pointer"
                disabled={isPending}
              >
                {acc.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-50"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  );
}
