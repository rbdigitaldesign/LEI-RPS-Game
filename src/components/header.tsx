import type { ReactNode } from 'react';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              className="h-6 w-6 text-primary"
            >
              <rect width="256" height="256" fill="none" />
              <path
                d="M164.4,147.6a40,40,0,0,1-62.8-45.2L74.7,63.1A8,8,0,0,1,80,52h96a8,8,0,0,1,5.7,13.7Z"
                opacity="0.2"
              />
              <path
                d="M168,44H80a16,16,0,0,0-11.3,27.3l37.9,38a8,8,0,0,0,11.4,0l37.9-38A16,16,0,0,0,168,44Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              />
              <path
                d="M91.6,108.4a40,40,0,0,0,62.8,45.2l26.9,39.3A8,8,0,0,1,176,204H80a8,8,0,0,1-5.7-13.7Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="16"
              />
            </svg>
            <span className="font-bold font-headline">RPS Pod Showdown</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            {children}
        </div>
      </div>
    </header>
  );
}
