import {
  FolderOpen,
  LayoutDashboard,
  Tickets,
  ShoppingBag,
} from "lucide-react";

const sidebarOptions = [
  { icon: LayoutDashboard, label: "Dashboard", path: "" },
  { icon: Tickets, label: "Codes and Access", path: "codes" },
  { icon: FolderOpen, label: "Content Explorer", path: "explorer" },
  { icon: ShoppingBag, label: "Store Front", path: "store" },
];

export default sidebarOptions;
