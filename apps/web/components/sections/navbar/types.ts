import { UserRole } from '@repo/store';

export interface NavItem {
  name: string;
  href: string;
  icon?: string;
  subItems?: SubItems[];
  thumbnail?: string;
  roles?: readonly UserRole[];
}

export interface SubItems {
  title?: string;
  items: SubItem[];
}

export interface SubItem {
  name: string;
  href: string;
  description?: string;
  icon?: string;
  roles?: readonly UserRole[];
}
