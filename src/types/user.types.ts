export interface UserPayload {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profilePic: string | null;
  provider: "GOOGLE" | "APPLE";
  linkedGuestId: string | null;
}

export interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  profilePic: string | null;
  guestId?: string | null;
  linkedGuestId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BillingDetailsInput {
  pincode: string;
  state: string;
  country: string;
  city: string;
  streetAddress: string;
  phoneNumber: string;
}
