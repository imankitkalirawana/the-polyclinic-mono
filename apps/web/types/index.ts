/** Re-export shared domain types and enums from store */
export type {
  Base,
  User,
  Doctor,
  DoctorSpecialization,
  Patient,
  Drug,
  Service,
  Department,
  Organization,
  Appointment,
  CreateAppointmentInput,
  AppointmentPatientInfo,
  AppointmentDoctorInfo,
  AppointmentQueue,
  AppointmentQueueRequest,
  QueuePatientInfo,
  QueueDoctorInfo,
  QueueUserInfo,
  PaymentMode,
  VerifyPaymentRequest,
  PaymentDetails,
  RegistrationRequest,
  RegistrationResponse,
  LoginRequest,
  LoginResponse,
  SendOTPRequest,
  VerifyOTPRequest,
  VerifyOTPResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  TimeSlot,
  DaySchedule,
  WeeklySchedule,
  GuestPermissions,
  SpecificDateAvailability,
  SlotConfig,
  ColumnDefinition,
  SelectedColumnDefinition,
  ActivityLog,
  ActivityLogResponse,
  ChangedField,
  Actor,
  ActivitySchema,
  VerificationType,
} from "@repo/store";

export {
  ColumnDataType,
  ColumnType,
  TableViewType,
  ActivityAction,
  ActorType,
  ActivityStatus,
} from "@repo/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type $FixMe = any;

export interface CountryProps {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phonecode: string;
  capital: string;
  currency: string;
  native: string;
  emoji: string;
}

export interface StateProps {
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  iso2: string;
  type: string;
  latitude: string;
  longitude: string;
}

export interface CityProps {
  id: number;
  name: string;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>;
  modal?: {
    onDismiss?: () => void;
  };
  payment?: {
    failed?: (response: {
      error: { code: string; description: string; source: string; step: string; reason: string };
    }) => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}
