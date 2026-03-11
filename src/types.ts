// src/types.ts

export interface Team {
  id: number;
  teamName: string;
  captainName: string;
  captainEmail: string;
  institute: string;
  members: string[]; // An array of strings
  registeredAt: string;
}

export interface RegistrationFormData {
  teamName: string;
  captainName: string;
  captainEmail: string;
  institute: string;
  members: string[];
}

// ─── Team Setup Types ─────────────────────────────────────────

export interface TeamLeaderDetails {
  name: string;
  collegeName: string;
  collegeState: string;
  collegePincode: string;
  department: string;
  year: string;
  whatsappNumber: string;
}

export interface TeamMemberDetails {
  name: string;
  department: string;
  year: string;
  whatsappNumber: string;
}

export interface WorkshopPreference {
  willing: boolean;
  mode: 'online' | 'offline' | null;
}

export interface TeamSetupData {
  leaderDetails: TeamLeaderDetails;
  memberDetails: TeamMemberDetails[];
  workshopPreference: WorkshopPreference;
}