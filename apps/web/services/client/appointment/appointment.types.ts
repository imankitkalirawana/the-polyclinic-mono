import { $FixMe } from '@/types';
import { Role } from '@/services/common/user/user.constants';
import { ButtonProps } from '@heroui/react';
import { Appointment, AppointmentStatus } from '@repo/store';

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
    statuses?: AppointmentStatus[];
    roles?: Role[];
    custom?: (appointment: Appointment, role: Role) => boolean;
  };
  action: {
    type: 'store-action' | 'async-function' | 'navigation';
    payload?: $FixMe;
    handler?: (appointment: Appointment) => Promise<void> | void;
    url?: (appointment: Appointment) => string;
  };
  content?: React.ComponentType<{
    appointment: Appointment;
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
