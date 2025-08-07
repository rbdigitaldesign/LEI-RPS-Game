'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PODS } from '@/lib/constants';

export function TeamSelector() {
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const handleGoToTeam = () => {
    if (selectedTeam) {
      window.location.href = `/team/${encodeURIComponent(selectedTeam)}`;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Quick Team Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger>
            <SelectValue placeholder="Select your team..." />
          </SelectTrigger>
          <SelectContent>
            {PODS.map((pod) => (
              <SelectItem key={pod.name} value={pod.name}>
                <div className="flex items-center gap-2">
                  <span>{pod.emoji}</span>
                  <span>{pod.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleGoToTeam} 
          disabled={!selectedTeam}
          className="w-full"
        >
          Go to Team Page
        </Button>
      </CardContent>
    </Card>
  );
}
