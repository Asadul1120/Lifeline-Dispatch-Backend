import { z } from "zod";

const auditLogQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;

      const page = Number(value);

      return Number.isInteger(page) && page >= 1;
    }, "Page must be a positive integer"),

  limit: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;

      const limit = Number(value);

      return Number.isInteger(limit) && limit >= 1 && limit <= 100;
    }, "Limit must be between 1 and 100"),

  userId: z.string().uuid().optional(),

  action: z.string().trim().min(1).max(100).optional(),

  entity: z.string().trim().min(1).max(100).optional(),

  search: z.string().trim().min(1).max(100).optional(),

  sortBy: z.enum(["createdAt", "action", "entity"]).optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  dateFrom: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;

      return !Number.isNaN(new Date(value).getTime());
    }, "Invalid dateFrom"),

  dateTo: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true;

      return !Number.isNaN(new Date(value).getTime());
    }, "Invalid dateTo"),
});

export const AuditLogValidation = {
  auditLogQuerySchema,
};
