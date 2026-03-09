import { Header } from './header';
import { Footer } from './footer';
import { Tenant } from '@/types';

interface MainLayoutProps {
  children: React.ReactNode;
  tenant: Tenant | null;
}

export function MainLayout({ children, tenant }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header tenant={tenant} />
      <main className="flex-1">{children}</main>
      <Footer tenant={tenant} />
    </div>
  );
}
