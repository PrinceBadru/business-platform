'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createLocation, archiveLocation } from '@/modules/locations/mutations';
import { MapPin, Plus, Archive, CheckCircle } from 'lucide-react';
import { switchLocation } from '@/modules/accounts/switcher';
import { useRouter } from 'next/navigation';

type Location = {
  id: string;
  name: string;
  accountId: string;
  isArchived: boolean | null;
  createdAt: Date;
};

type Props = {
  locations: Location[];
  canManage: boolean;
  activeLocationId: string | null;
};

export default function LocationsClient({ locations, canManage, activeLocationId }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const activeLocations = locations.filter((l) => !l.isArchived);
  const archivedLocations = locations.filter((l) => l.isArchived);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Location name is required.');
    setError('');
    startTransition(async () => {
      try {
        await createLocation(name.trim());
        setName('');
        setOpen(false);
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to create location.');
      }
    });
  }

  function handleArchive(locationId: string) {
    if (!confirm('Archive this location? It will be hidden from active views.')) return;
    startTransition(async () => {
      await archiveLocation(locationId);
      router.refresh();
    });
  }

  function handleSwitch(locationId: string) {
    startTransition(async () => {
      await switchLocation(locationId);
    });
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-gray-500 mt-1">
            Manage your business locations. Each location has its own stock and staff access.
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Location</DialogTitle>
                <DialogDescription>
                  Create a new physical location or branch for your business.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loc-name">Location Name</Label>
                  <Input
                    id="loc-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Downtown Branch, Warehouse 2"
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? 'Creating...' : 'Create Location'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Active Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Active Locations
            <Badge variant="secondary">{activeLocations.length}</Badge>
          </CardTitle>
          <CardDescription>
            Click &quot;Switch&quot; to set a location as your active context for new transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeLocations.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No active locations yet.</p>
          ) : (
            <div className="divide-y">
              {activeLocations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                      <MapPin className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">{loc.name}</p>
                      {activeLocationId === loc.id && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Active
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {activeLocationId !== loc.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitch(loc.id)}
                        disabled={isPending}
                      >
                        Switch
                      </Button>
                    )}
                    {canManage && activeLocations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(loc.id)}
                        disabled={isPending}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archived */}
      {archivedLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-500 flex items-center gap-2 text-base">
              <Archive className="h-4 w-4" />
              Archived Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {archivedLocations.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between py-3 opacity-60">
                  <p className="font-medium">{loc.name}</p>
                  <Badge variant="outline">Archived</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
