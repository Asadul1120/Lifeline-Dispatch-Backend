import { Priority } from "../../generated/prisma/enums.ts";

export interface ICreateEmergencyRequest {
  pickupLocation: string;
  destination?: string;
  emergencyType: string;
  priority?: Priority;
}