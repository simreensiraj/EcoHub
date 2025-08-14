
'use client';

import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  Recycle,
  Settings as SettingsIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export function SidebarNav() {
  const pathname = usePathname();
  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/sustainabot', icon: Bot, label: 'SustainaBOT' },
    { href: '/greenmart', icon: Recycle, label: 'GreenMart' },
    { href: '/forum', icon: MessageSquare, label: 'Forum' },
    { href: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            size="lg"
            isActive={pathname === item.href}
            tooltip={{ children: item.label }}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
