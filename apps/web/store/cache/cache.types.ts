import { Patient } from '@/services/client/patient';
import { DoctorSpecialization, Doctor } from '@/services/client/doctor';
import { Department } from '@/services/client/department/department.types';
import { Drug } from '@/services/client/drug/drug.types';
import { Appointment } from '@/services/client/appointment/appointment.types';
import { AppointmentQueue } from '@/services/client/appointment/queue/queue.types';
import { User } from '@/services/common/user/user.types';

/**
 * Cache Registry - Central type definition for all cacheable entities
 *
 * To add a new cacheable entity:
 * 1. Add the type import above
 * 2. Add the key-type mapping to CacheRegistry
 *
 * The cache system will automatically infer types based on these mappings.
 */
export interface CacheRegistry {
  // Collections (arrays)
  patients: Patient[];
  doctors: Doctor[];
  departments: Department[];
  drugs: Drug[];
  appointments: Appointment[];
  appointmentQueues: AppointmentQueue[];
  users: User[];
  specializations: DoctorSpecialization[];
  // Single entities (for selections, current items, etc.)
  selectedPatient: Patient | null;
  selectedDoctor: Doctor | null;
  selectedDepartment: Department | null;
  selectedDrug: Drug | null;
  selectedAppointment: Appointment | null;
  selectedAppointmentQueue: AppointmentQueue | null;
  selectedUser: User | null;

  // Indexed entities (by ID)
  patientById: Record<string, Patient>;
  doctorById: Record<string, Doctor>;
  departmentById: Record<string, Department>;
  drugById: Record<string, Drug>;
  appointmentById: Record<string, Appointment>;
  appointmentQueueById: Record<string, AppointmentQueue>;
  userById: Record<string, User>;
}

/**
 * All valid cache keys
 */
export type CacheKey = keyof CacheRegistry;

/**
 * Get the type for a specific cache key
 */
export type CacheValue<K extends CacheKey> = CacheRegistry[K];

/**
 * Cache entry with metadata
 */
export interface CacheEntry<K extends CacheKey> {
  data: CacheRegistry[K];
  timestamp: number;
  stale: boolean;
}

/**
 * Configuration for cache behavior
 */
export interface CacheConfig {
  /** Time in milliseconds before cache is considered stale */
  staleTime?: number;
  /** Whether to persist this cache key to storage */
  persist?: boolean;
}

/**
 * Options for the useQueryWithCache hook
 */
export interface CacheOptions<K extends CacheKey> {
  /** The cache key to store the data under */
  cacheKey: K;
  /** Optional transform function to modify data before caching */
  transform?: (data: CacheRegistry[K]) => CacheRegistry[K];
  /** Cache configuration */
  config?: CacheConfig;
}

/**
 * Options for indexed cache (by ID)
 */
export interface IndexedCacheOptions<K extends CacheKey> {
  /** The cache key for the indexed store */
  indexKey: K;
  /** The ID of the entity being cached */
  entityId: string;
  /** Cache configuration */
  config?: CacheConfig;
}

/**
 * Type guard to check if a key is a valid cache key
 */
export function isCacheKey(key: string): key is CacheKey {
  const validKeys: CacheKey[] = [
    'patients',
    'doctors',
    'departments',
    'drugs',
    'appointments',
    'appointmentQueues',
    'users',
    'selectedPatient',
    'selectedDoctor',
    'selectedDepartment',
    'selectedDrug',
    'selectedAppointment',
    'selectedAppointmentQueue',
    'selectedUser',
    'patientById',
    'doctorById',
    'departmentById',
    'drugById',
    'appointmentById',
    'appointmentQueueById',
    'userById',
  ];
  return validKeys.includes(key as CacheKey);
}

/**
 * Default values for each cache key (used for initialization)
 */
export const cacheDefaults: CacheRegistry = {
  patients: [],
  doctors: [],
  departments: [],
  drugs: [],
  appointments: [],
  appointmentQueues: [],
  users: [],
  specializations: [],
  selectedPatient: null,
  selectedDoctor: null,
  selectedDepartment: null,
  selectedDrug: null,
  selectedAppointment: null,
  selectedAppointmentQueue: null,
  selectedUser: null,
  patientById: {},
  doctorById: {},
  departmentById: {},
  drugById: {},
  appointmentById: {},
  appointmentQueueById: {},
  userById: {},
};
