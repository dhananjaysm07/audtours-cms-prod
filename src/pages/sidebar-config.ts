import { FolderOpen, LayoutDashboard, Tickets } from 'lucide-react';

const sidebarOptions = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '' },
  { icon: Tickets, label: 'Codes and Access', path: 'codes' },
  { icon: FolderOpen, label: 'Content Explorer', path: 'explorer' },
];

export default sidebarOptions;
