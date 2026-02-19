import { $FixMe } from '@/types';
import { ButtonProps } from '@heroui/react';
import { AppointmentQueue, QueueStatus, UserRole } from '@repo/store';

export type ActionType =
  | 'reschedule'
  | 'cancel'
  | 'delete'
  | 'reminder'
  | 'add-to-calendar'
  | 'bulk-cancel'
  | 'bulk-delete'
  | 'new-tab';

export type DropdownKeyType = 'invoice' | 'reports' | 'edit' | 'delete';

export type ButtonConfig = {
  key: string;
  label: string;
  icon: string;
  color: ButtonProps['color'];
  variant: ButtonProps['variant'];
  position: 'left' | 'right';
  isIconOnly?: boolean;
  whileLoading?: string;
  visibilityRules: {
    statuses?: QueueStatus[];
    roles?: UserRole[];
    custom?: (appointment: AppointmentQueue, role: UserRole) => boolean;
  };
  action: {
    type: 'store-action' | 'async-function' | 'navigation';
    payload?: $FixMe;
    handler?: (appointment: AppointmentQueue) => Promise<void> | void;
    url?: (appointment: AppointmentQueue) => string;
  };
  content?: React.ComponentType<{
    appointment: AppointmentQueue;
    onClose: () => void;
  }>;
};

export type ProcessedButton = {
  key: string;
  children: string;
  startContent: React.ReactNode;
  color: ButtonProps['color'];
  variant: ButtonProps['variant'];
  position: 'left' | 'right';
  isIconOnly?: boolean;
  whileLoading?: string;
  isHidden: boolean;
  onPress: () => Promise<void> | void;
  content?: React.ReactNode;
};
