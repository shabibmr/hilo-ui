'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  MessageSquare,
  Truck,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import NextLink from 'next/link';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Collections', href: '/collections', icon: Layers },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Enquiries', href: '/enquiries', icon: MessageSquare },
  { name: 'Purchases', href: '/purchases', icon: Truck },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const content = (
    <div className="flex flex-col h-full bg-[#1b1917] text-stone-300 w-64 border-r border-stone-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-stone-800">
        <NextLink href="/" className="flex items-center space-x-2">
          <span className="text-xl font-serif tracking-wider font-semibold text-amber-200">
            Hilo Arte
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase bg-stone-800 text-stone-300 px-2 py-0.5 rounded">
            Admin
          </span>
        </NextLink>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-stone-400 hover:text-white p-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href);

          return (
            <NextLink
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#380b0c] text-white font-semibold shadow-sm'
                  : 'text-stone-400 hover:bg-stone-800/70 hover:text-stone-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-stone-400'}`} />
              <span>{item.name}</span>
            </NextLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-stone-800">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="truncate mr-2">
            <p className="text-xs font-medium text-stone-200 truncate">
              {user?.email || 'Admin User'}
            </p>
            <p className="text-[10px] text-stone-500 uppercase tracking-wider">Administrator</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium text-stone-400 hover:text-white bg-stone-800/60 hover:bg-stone-800 rounded-lg transition-colors border border-stone-700/50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-shrink-0 min-h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#1b1917] z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
