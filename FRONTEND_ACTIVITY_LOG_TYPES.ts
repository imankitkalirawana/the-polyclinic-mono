/**
 * Activity Log Types for Frontend
 * 
 * Copy this file to your frontend project and use these types
 * when consuming the activity logs API endpoint:
 * GET /api/v1/client/appointments/queue/:id/activity-logs
 */

export enum ActivityAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  DELETED = 'DELETED',
  SOFT_DELETED = 'SOFT_DELETED',
}

export enum ActorType {
  USER = 'USER',
  SYSTEM = 'SYSTEM',
}

/**
 * Structure of a changed field in activity logs
 */
export interface ChangedField {
  before: any;
  after: any;
}

/**
 * Actor information (user who performed the action)
 */
export interface Actor {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

/**
 * Activity Log Response Interface
 * 
 * This represents a single activity log entry returned from the API
 * with full actor information included
 */
export interface ActivityLogResponse {
  /** Unique identifier for the activity log */
  id: string;
  
  /** Type of entity this log refers to (e.g., "Queue", "Patient", "Doctor") */
  entityType: string;
  
  /** ID of the entity this log refers to */
  entityId: string;
  
  /** Module name where the activity occurred (e.g., "appointments", "patients") */
  module: string;
  
  /** Type of action that was performed */
  action: ActivityAction;
  
  /** 
   * Object containing only the fields that changed.
   * Key is the field name, value contains before/after values.
   * Example: { "status": { "before": "BOOKED", "after": "CALLED" } }
   */
  changedFields: Record<string, ChangedField> | null;
  
  /** Snapshot of the entity before the change (optional) */
  previousData: Record<string, any> | null;
  
  /** Snapshot of the entity after the change (optional) */
  newData: Record<string, any> | null;
  
  /** Type of actor who performed the action (USER or SYSTEM) */
  actorType: ActorType;
  
  /** ID of the user who performed the action (null if SYSTEM) */
  actorId: string | null;
  
  /** Role of the user who performed the action (null if SYSTEM) */
  actorRole: string | null;
  
  /** 
   * Full actor information including name, email, image, and role.
   * null if actorType is SYSTEM or if actor was deleted
   */
  actor: Actor | null;
  
  /** Human-readable description of what happened (optional) */
  description: string | null;
  
  /** ISO 8601 timestamp when the activity occurred */
  createdAt: string;
}

/**
 * Example usage in a React component:
 * 
 * ```typescript
 * import { ActivityLogResponse, ActivityAction, ActorType } from './types/activity-log';
 * 
 * const [activityLogs, setActivityLogs] = useState<ActivityLogResponse[]>([]);
 * 
 * useEffect(() => {
 *   fetch(`/api/v1/client/appointments/queue/${queueId}/activity-logs`)
 *     .then(res => res.json())
 *     .then((data: ActivityLogResponse[]) => setActivityLogs(data));
 * }, [queueId]);
 * 
 * return (
 *   <div>
 *     {activityLogs.map(log => (
 *       <div key={log.id}>
 *         {log.actor && (
 *           <div>
 *             <img src={log.actor.image || '/default-avatar.png'} alt={log.actor.name} />
 *             <span>{log.actor.name}</span>
 *             <span>{log.actor.email}</span>
 *             <span>{log.actor.role}</span>
 *           </div>
 *         )}
 *         <p>{log.description || `${log.action} by ${log.actorRole || 'System'}`}</p>
 *         <p>{new Date(log.createdAt).toLocaleString()}</p>
 *       </div>
 *     ))}
 *   </div>
 * );
 * ```
 */

