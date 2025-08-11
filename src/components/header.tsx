
import type { ReactNode } from 'react';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="text-xl font-bold text-primary font-headline">RPS Pod Showdown</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            {children}
        </div>
      </div>
    </header>
  );
}
