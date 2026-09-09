export interface IDriverApplyPayload {
  name: string;
  email: string;
  password: string;
  licenseNumber: string;
  experience: number;
  currentLocation?: string;
  contactNumber?: string;
}

export interface  IDriverVerifyEmail {
  email: string;
  otp: string;
}