export interface ICreateAuditLog {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
}
