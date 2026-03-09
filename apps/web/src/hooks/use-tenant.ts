import { useState, useEffect } from 'react';
import { Tenant } from '@/types';
import { tenantService } from '@/services/api';
import { useBookingStore } from '@/stores/booking-store';
import { getSubdomain } from '@/lib/utils';

export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setCurrentTenant = useBookingStore((state) => state.setCurrentTenant);

  useEffect(() => {
    async function loadTenant() {
      try {
        setLoading(true);
        const subdomain = getSubdomain(window.location.hostname);
        
        if (!subdomain) {
          throw new Error('無法識別民宿，請確認網址正確');
        }

        const data = await tenantService.getTenantBySubdomain(subdomain);
        setTenant(data);
        setCurrentTenant(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入民宿資訊失敗');
      } finally {
        setLoading(false);
      }
    }

    if (typeof window !== 'undefined') {
      loadTenant();
    }
  }, [setCurrentTenant]);

  return { tenant, loading, error };
}

export function useTenantFromHostname() {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sd = getSubdomain(window.location.hostname);
      setSubdomain(sd);
    }
  }, []);

  return subdomain;
}
