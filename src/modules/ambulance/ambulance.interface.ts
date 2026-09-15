import { AmbulanceStatus, AmbulanceType } from "../../generated/prisma/enums.ts";

export interface ICreateAmbulance {
  driverId: string;
  vehicleNumber: string;
  type?: AmbulanceType;
  location?: string;
}

export interface IUpdateAmbulance {
  vehicleNumber?: string;
  type?: AmbulanceType;
  location?: string;
}

export interface IUpdateAmbulanceStatus {
  status: AmbulanceStatus;
  location?: string;
}