export interface Staff {
  staff_id: number;
  full_name: string;
  access_code: string;
  dob: string;
  email: string;
  joined_date: string;
  is_active: boolean;
  role_name: string;
  can_toggle_channel: boolean;
  can_waste: boolean;
  can_refund: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffFormData {
  full_name: string;
  access_code: string;
  dob: string;
  email: string;
  joined_date: string;
  is_active: boolean;
  role_name: string;
  can_toggle_channel: boolean;
  can_waste: boolean;
  can_refund: boolean;
}

export interface ValidationErrors {
  [key: string]: string[];
}
