'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-media-query';
import { Tenant } from '@/types';

interface HeaderProps {
  tenant: Tenant | null;
}

export function Header({ tenant }: HeaderProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: '首頁', href: '/' },
    { label: '房型介紹', href: '/rooms' },
    { label: '關於我們', href: '/about' },
    { label: '線上訂房', href: '/booking' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {tenant?.logoUrl ? (
              <img 
                src={tenant.logoUrl} 
                alt={tenant.name}
                className="h-10 w-auto"
              />
            ) : (
              <div className="flex items-center gap-2">
                <Home className="h-6 w-6 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">
                  {tenant?.name || 'InnSaaS'}
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Contact Info - Desktop */}
          {!isMobile && tenant?.phone && (
            <a
              href={`tel:${tenant.phone}`}
              className="hidden md:flex items-center gap-2 text-gray-700 hover:text-primary-600"
            >
              <Phone className="h-4 w-4" />
              <span className="text-sm">{tenant.phone}</span>
            </a>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? '關閉選單' : '開啟選單'}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="flex flex-col px-4 py-4 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              >
                {item.label}
              </Link>
            ))}
            {tenant?.phone && (
              <a
                href={`tel:${tenant.phone}`}
                className="flex items-center gap-2 py-3 px-4 text-primary-600 hover:bg-primary-50 rounded-lg font-medium"
              >
                <Phone className="h-4 w-4" />
                {tenant.phone}
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
