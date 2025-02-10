import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import AppSidebar from '@/components/app-sidebar';
import { Suspense, useEffect } from 'react';
import LoadingSpinner from '@/components/spinner';
import { Outlet, useLocation, useNavigate } from 'react-router';
import sidebarOptions from './pages/sidebar-config';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from './store/useAuthStore';

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pathnameInitial =
    pathname.split('/').length > 1 ? pathname.split('/')[1] : '';

  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) navigate('/sign-in');
  }, [isAuthenticated, navigate]);

  return (
    <SidebarProvider>
      <Toaster position="top-center" />
      <AppSidebar />
      <SidebarInset className="flex-1 p-4 rounded-xl flex flex-col bg-neutral-100">
        <nav className="flex gap-4 items-end pb-4">
          <SidebarTrigger className="text-neutral-500" />
          <h1 className="text-2xl font-bold text-neutral-700">
            {
              sidebarOptions.filter((item) => item.path == pathnameInitial)[0]
                .label
            }
          </h1>
        </nav>
        <Suspense
          fallback={
            <div className="grid place-items-center h-full w-full">
              <LoadingSpinner />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
