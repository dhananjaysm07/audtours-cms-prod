import { USER_ROLE } from '@/types';
import {
  FolderOpen,
  LayoutDashboard,
  Tickets,
  ShoppingBag,
} from 'lucide-react';

const sidebarOptions = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '',
    roles: [
      USER_ROLE.USER,
      USER_ROLE.ADMIN,
      USER_ROLE.CONTENT_MANAGER,
      USER_ROLE.OPERATION_MANAGER,
      USER_ROLE.STORE_MANAGER,
    ],
  },
  {
    icon: Tickets,
    label: 'Codes and Access',
    path: 'codes',
    roles: [USER_ROLE.ADMIN, USER_ROLE.OPERATION_MANAGER],
  },
  {
    icon: FolderOpen,
    label: 'Content Explorer',
    path: 'explorer',
    roles: [USER_ROLE.ADMIN, USER_ROLE.CONTENT_MANAGER],
  },
  {
    icon: ShoppingBag,
    label: 'Store Front',
    path: 'store',
    roles: [USER_ROLE.ADMIN, USER_ROLE.STORE_MANAGER],
  },
];

export default sidebarOptions;
