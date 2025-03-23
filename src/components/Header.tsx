'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-zinc-900 text-white p-4 flex items-center justify-between">
      <nav className="flex gap-6">
        <Link href="/" className={pathname === '/' ? 'underline font-bold' : ''}>
          Home
        </Link>
      </nav>

      {/* User avatar with dropdown */}
      {session?.user?.image && (
        <div className="relative" ref={dropdownRef}>
          <img
            src={session.user.image}
            alt="User avatar"
            className="w-10 h-10 rounded-full border-2 border-green-500 shadow cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm hover:bg-zinc-700"
                onClick={() => setDropdownOpen(false)}
              >
                View Profile
              </Link>
              <button
                onClick={() => signOut()}
                className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 text-red-400"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
