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
            {sidebarOptions.map((item) => (
              <SidebarMenuItem>
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
        <span className="text-xs text-neutral-400">Yo Tours</span>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
