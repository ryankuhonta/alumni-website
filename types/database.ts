export type UserRole = 'admin' | 'alumni'
export type UserStatus = 'approved' | 'pending' | 'rejected' | 'banned'
export type RSVPStatus = 'going' | 'maybe' | 'not_going'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'freelance' | 'service' | 'product'
export type JobStatus = 'active' | 'closed' | 'removed'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  batch_year: number
  course?: string
  current_company?: string
  location?: string
  profile_picture?: string
  mobile_number?: string
  facebook_url?: string
  linkedin_url?: string
  job_title?: string
  birthday?: string
  role: UserRole
  status: UserStatus
  privacy_company: boolean
  privacy_location: boolean
  created_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  event_date: string
  event_time?: string
  venue?: string
  map_url?: string
  cover_image?: string
  created_by: string
  created_at: string
}

export interface EventRSVP {
  id: string
  event_id: string
  user_id: string
  status: RSVPStatus
  created_at: string
}

export interface EventPhoto {
  id: string
  event_id: string
  photo_url: string
  caption?: string
  uploaded_by: string
  created_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  cover_image?: string
  is_pinned: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  title: string
  company: string
  location?: string
  description: string
  requirements?: string
  application_link?: string
  application_email?: string
  job_type: JobType
  posted_by: string
  status: JobStatus
  created_at: string
}

export interface Officer {
  id: string
  user_id?: string
  position: string
  name: string
  photo_url?: string
  display_order: number
  term_year?: string
  created_at: string
}

export interface OrganizationInfo {
  id: string
  mission: string
  vision: string
  about?: string
  logo_url?: string
  school_logo_url?: string
  show_logo_navbar?: boolean
  show_logo_hero?: boolean
  show_logo_footer?: boolean
  show_logo_about?: boolean
  show_alumni_logo_about?: boolean
  site_name?: string
  tagline?: string
  primary_color?: string
  log_retention_years?: number
  facebook_url?: string
  instagram_url?: string
  linkedin_url?: string
  show_facebook?: boolean
  show_instagram?: boolean
  show_linkedin?: boolean
  updated_at: string
}
