export interface IUpdateUserPayload {
  name?: string;

  patient?: {
    phone?: string;

    address?: string;

    bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

    emergencyContact?: string;
  };

  driver?: {
    licenseNumber?: string;

    experience?: number;

    currentLocation?: string;

    contactNumber?: string;
  };
}
