import Link from 'next/link';
import { MapPin, Phone, Mail, Facebook, Instagram } from 'lucide-react';
import { Tenant } from '@/types';

interface FooterProps {
  tenant: Tenant | null;
}

export function Footer({ tenant }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 民宿資訊 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              {tenant?.name || 'InnSaaS 民宿'}
            </h3>
            {tenant?.description && (
              <p className="text-sm text-gray-400 mb-4">{tenant.description}</p>
            )}
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* 聯絡資訊 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">聯絡我們</h3>
            <ul className="space-y-3">
              {tenant?.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{tenant.address}</span>
                </li>
              )}
              {tenant?.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary-400 flex-shrink-0" />
                  <a 
                    href={`tel:${tenant.phone}`}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {tenant.phone}
                  </a>
                </li>
              )}
              {tenant?.email && (
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary-400 flex-shrink-0" />
                  <a 
                    href={`mailto:${tenant.email}`}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {tenant.email}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* 快速連結 */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">快速連結</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/"
                  className="text-sm hover:text-white transition-colors"
                >
                  首頁
                </Link>
              </li>
              <li>
                <Link 
                  href="/rooms"
                  className="text-sm hover:text-white transition-colors"
                >
                  房型介紹
                </Link>
              </li>
              <li>
                <Link 
                  href="/about"
                  className="text-sm hover:text-white transition-colors"
                >
                  關於我們
                </Link>
              </li>
              <li>
                <Link 
                  href="/booking"
                  className="text-sm hover:text-white transition-colors"
                >
                  線上訂房
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-500">
            © {currentYear} {tenant?.name || 'InnSaaS'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
