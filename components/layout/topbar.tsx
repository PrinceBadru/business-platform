'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { Search, Bell, LogOut, User, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { switchLocation } from '@/modules/accounts/switcher';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeSwitcher } from '@/components/theme-switcher';

type SearchResult = {
  type: 'offering' | 'customer' | 'transaction';
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export function Topbar({ 
  userName,
  locations = [],
  activeLocationId = null,
  activeRole = 'employee'
}: { 
  userName?: string,
  locations?: { id: string; name: string }[],
  activeLocationId?: string | null,
  activeRole?: string
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleResultClick(href: string) {
    setShowDropdown(false);
    setQuery('');
    router.push(href);
  }

  const typeIcon: Record<string, string> = {
    offering: '📦',
    customer: '👤',
    transaction: '🧾',
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      {/* Search */}
      <div className="flex-1 max-w-md" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
          <Input
            id="global-search"
            placeholder="Search products, customers…"
            className="pl-9 bg-gray-50 dark:bg-gray-900 border-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            autoComplete="off"
          />
          {searching && (
            <div className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          )}

          {/* Results Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border bg-white dark:bg-gray-950 shadow-lg z-50 overflow-hidden">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">No results found for &quot;{query}&quot;</p>
              ) : (
                <ul>
                  {results.map((r) => (
                    <li key={`${r.type}-${r.id}`}>
                      <button
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-start gap-3 transition-colors"
                        onClick={() => handleResultClick(r.href)}
                      >
                        <span className="text-base mt-0.5">{typeIcon[r.type] ?? '🔍'}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.title}</p>
                          <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
      {/* Right side */}
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        {locations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                {locations.find(l => l.id === activeLocationId)?.name || 'Select Location'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {locations.map(loc => (
                <DropdownMenuItem 
                  key={loc.id}
                  onClick={() => startTransition(() => switchLocation(loc.id))}
                  className="cursor-pointer"
                >
                  {loc.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-gray-500" />
        </Button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {userName ? userName[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {userName && (
              <>
                <div className="px-2 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-50">{userName}</div>
                <DropdownMenuSeparator />
              </>
            )}
            {activeRole !== 'employee' && (
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" /> Profile & Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/signout" className="cursor-pointer text-red-500 hover:text-red-600">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
