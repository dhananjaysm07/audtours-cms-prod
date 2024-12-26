import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import sidebarOptions from '@/pages/sidebar-config';
import { useLocation } from 'react-router';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

function AppSidebar() {
  const { pathname } = useLocation();
  const pathnameInitial =
    pathname.split('/').length > 1 ? pathname.split('/')[1] : '';

  return (
    <Sidebar className="pr-0" variant="inset" side="left">
      <SidebarHeader className="pt-4">
        <div className="flex flex-col gap-2 pt-2 pl-1">
          <h1 className="font-bold text-2xl leading-none text-neutral-600">
            audtours
          </h1>
          {/* <span className="text-sm">hi prakash!</span>
          <span>Administrator</span> */}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarMenu>
            {sidebarOptions.map((item, _index) => (
              <SidebarMenuItem key={_index}>
                <SidebarMenuButton
                  isActive={item.path === pathnameInitial}
                  asChild
                >
                  <a href={`/${item.path}`}>
                    <item.icon
                      size={20}
                      className="shrink-0"
                      strokeWidth={item.path === pathnameInitial ? 2 : 1.75}
                    />
                    <span className="text-sm">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex gap-2 items-center bg-neutral-100 rounded-md p-2">
          <img src="/admin-icon.png" alt="Admin Icon" className="h-10" />
          <div className="flex flex-col gap-1 text-nowrap truncate">
            <span className="text font-semibold leading-none truncate">
              John Doe
            </span>
            <span className="text-sm leading-none text-muted-foreground truncate">
              Administrator Privileges
            </span>
          </div>
          <Button variant={'ghost'} size={'sm'} className="p-1 min-h-0 min-w-0">
            <LogOut />
          </Button>
        </div>
        <span className="text-xs text-neutral-400">Yo Tours</span>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
