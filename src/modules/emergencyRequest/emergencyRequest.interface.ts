import { Priority } from "../../generated/prisma/enums.ts";

export interface ICreateEmergencyRequest {
  pickupLocation: string;
  destination?: string;
  emergencyType: string;
  priority?: Priority;
}

export interface IEmergencyRequestQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  emergencyType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}
