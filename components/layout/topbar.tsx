'use client';
import { Search, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search..." 
            className="pl-9 bg-gray-50 dark:bg-gray-900 border-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-gray-500" />
        </Button>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-red-500">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
