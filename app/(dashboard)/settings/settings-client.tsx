'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateAccountSettings } from '@/modules/account/mutations';
import { createLocation, archiveLocation } from '@/modules/locations/mutations';
import { Building, MapPin, Plus, Trash, Palette } from 'lucide-react';
import { ThemeSwitcher } from '@/components/theme-switcher';

export function SettingsClient({ account, locations }: { account: any, locations: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(account.name);
  const [businessType, setBusinessType] = useState(account.businessType);
  const [benchmarkingEnabled, setBenchmarkingEnabled] = useState(account.settings?.benchmarkingEnabled ?? false);
  
  const [newLocationName, setNewLocationName] = useState('');

  const handleSaveAccount = () => {
    startTransition(async () => {
      await updateAccountSettings(name, businessType, { 
        ...account.settings, 
        benchmarkingEnabled 
      });
    });
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) return;
    startTransition(async () => {
      await createLocation(newLocationName);
      setNewLocationName('');
    });
  };

  const handleArchiveLocation = (id: string) => {
    startTransition(async () => {
      await archiveLocation(id);
    });
  };

  const activeLocations = locations.filter(l => !l.isArchived);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-500" />
            Account Profile
          </CardTitle>
          <CardDescription>
            Update your core business identity. This is visible to your team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Business Name</label>
            <Input 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="businessType" className="text-sm font-medium">Business Type</label>
            <select
              id="businessType"
              value={businessType}
              onChange={e => setBusinessType(e.target.value as any)}
              disabled={isPending}
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-gray-300"
            >
              <option value="retail">Retail</option>
              <option value="services">Services</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Industry Benchmarking</label>
              <p className="text-xs text-gray-500">Contribute anonymized data to see how you perform against similar businesses.</p>
            </div>
            <input 
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-950 dark:border-gray-700 dark:bg-gray-800"
              checked={benchmarkingEnabled}
              onChange={e => setBenchmarkingEnabled(e.target.checked)}
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveAccount} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gray-500" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Dashboard Theme</label>
              <p className="text-xs text-gray-500">Select a theme that matches your brand or preference.</p>
            </div>
            <ThemeSwitcher />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-500" />
            Physical Locations
          </CardTitle>
          <CardDescription>
            Manage the branches or service areas for your business.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="newLocation" className="text-sm font-medium">New Location Name</label>
              <Input 
                id="newLocation" 
                placeholder="e.g. Downtown Store"
                value={newLocationName} 
                onChange={e => setNewLocationName(e.target.value)} 
                disabled={isPending}
              />
            </div>
            <Button onClick={handleAddLocation} disabled={isPending || !newLocationName.trim()}>
              <Plus className="w-4 h-4 mr-2" /> Add Location
            </Button>
          </div>

          <div className="space-y-3">
            {activeLocations.length === 0 ? (
              <p className="text-sm text-gray-500">No active locations.</p>
            ) : (
              activeLocations.map(loc => (
                <div key={loc.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900/50">
                  <span className="font-medium">{loc.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleArchiveLocation(loc.id)}
                    disabled={isPending}
                  >
                    <Trash className="w-4 h-4 mr-2" /> Archive
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
