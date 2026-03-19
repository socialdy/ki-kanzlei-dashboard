/* ── Unipile API Types ── */

export interface UnipileSearchResult {
  id: string;
  type?: string;
  name?: string;
  provider_id?: string;
  public_identifier?: string;
  first_name?: string;
  last_name?: string;
  member_urn?: string;
  headline?: string;
  location?: string;
  industry?: string;
  profile_picture_url?: string;
  profile_picture_url_large?: string;
  profile_url?: string;
  public_profile_url?: string;
  network_distance?: string;
  verified?: boolean;
}

export interface UnipileSearchResponse {
  object: string;
  items: UnipileSearchResult[];
  cursor?: string | null;
  paging?: {
    start: number;
    page_count: number;
    total_count: number;
  };
}

export interface UnipileProfile {
  provider_id: string;
  public_identifier?: string;
  first_name?: string;
  last_name?: string;
  headline?: string;
  summary?: string;
  location?: string;
  industry?: string;
  profile_picture_url?: string;
  profile_picture_url_large?: string;
  background_picture_url?: string;
  profile_url?: string;
  network_distance?: string;
  is_open_profile?: boolean;
  is_premium?: boolean;
  is_influencer?: boolean;
  is_creator?: boolean;
  follower_count?: number;
  connections_count?: number;
  /* Extended sections (require linkedin_sections=*) */
  work_experience?: UnipileWorkExperience[];
  education?: UnipileEducation[];
  skills?: string[];
  languages?: string[];
  certifications?: UnipileCertification[];
  /* Legacy field names (some API versions) */
  positions?: UnipileWorkExperience[];
  educations?: UnipileEducation[];
}

export interface UnipileWorkExperience {
  title?: string;
  company?: string;
  company_name?: string;
  company_picture_url?: string;
  location?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  skills?: string[];
}

export interface UnipileEducation {
  school?: string;
  school_name?: string;
  school_picture_url?: string;
  degree?: string;
  field_of_study?: string;
  dates?: string;
  start_date?: string;
  end_date?: string;
}

export interface UnipileCertification {
  name?: string;
  authority?: string;
  url?: string;
}

export interface UnipileChat {
  id: string;
  provider_id: string;
  attendees?: { provider_id: string; name?: string }[];
}

export interface UnipileMessage {
  id: string;
  text?: string;
  sender_provider_id?: string;
  created_at?: string;
}

export interface UnipileAccount {
  id: string;
  provider?: string;
  type?: string;
  name?: string;
  status?: string;
  connection_params?: {
    im?: {
      id?: string;
      publicIdentifier?: string;
      username?: string;
      premiumFeatures?: string[];
      premiumId?: string | null;
      organizations?: Array<{ name: string; messaging_enabled: boolean }>;
    };
  };
}

export interface UnipileInviteResponse {
  object: string;
  provider_id?: string;
}

export interface UnipileError {
  status: number;
  message: string;
  code?: string;
}
