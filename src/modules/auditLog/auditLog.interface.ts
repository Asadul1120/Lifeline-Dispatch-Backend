export interface ICreateAuditLog {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
}

export interface IAuditLogQuery {
  page?: string;
  limit?: string;
  userId?: string;
  action?: string;
  entity?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  dateFrom?: string;
  dateTo?: string;
}
