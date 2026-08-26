'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, PlaySquare, Network, LogOut } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-3.5 px-4 py-3 rounded-lg text-[13.5px] font-medium transition-colors ${
      active 
        ? 'text-white bg-indigo-600 shadow-sm' 
        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
    }`;
  };

  const getIconClasses = (path: string) => {
    const active = isActive(path);
    return `w-[18px] h-[18px] ${active ? 'text-white' : 'text-gray-400'}`;
  };

  return (
    <aside className="w-[260px] bg-[#12141D] flex flex-col justify-between shrink-0 h-screen border-r border-[#1e2130]">
      <div>
        <div className="h-20 flex items-center px-6 border-b border-[#1e2130]/60 mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-8 h-8 rounded-full border border-gray-600/50 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Reload Dashboard"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <div>
              <div className="font-bold text-white text-[16px] tracking-wide">RecoverAI</div>
            </div>
          </div>
        </div>

        <div className="px-4">
          <nav className="space-y-1.5">
            <Link href="/" className={getLinkClasses('/')}>
              <Home className={getIconClasses('/')} />
              Dashboard
            </Link>
            <Link href="/cases" className={getLinkClasses('/cases')}>
              <FileText className={getIconClasses('/cases')} />
              Failed Payments
            </Link>
            <Link href="/simulation" className={getLinkClasses('/simulation')}>
              <PlaySquare className={getIconClasses('/simulation')} />
              Simulation
            </Link>
            
            <Link href="/architecture" className={getLinkClasses('/architecture')}>
              <Network className={getIconClasses('/architecture')} />
              Decision Pipeline
            </Link>
          </nav>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Removed company and sign out placeholders */}
      </div>
    </aside>
  );
}
