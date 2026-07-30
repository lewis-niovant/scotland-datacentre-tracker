/* Types for the Observatory dataset (app/public/data/observatory.json).
   Almost everything is optional: records are built by manual research and
   fields are omitted when unverified. */

export type UncertaintyState =
  | 'confirmed' | 'reported' | 'developer_stated' | 'modelled' | 'inferred'
  | 'estimated' | 'disputed' | 'unknown' | 'not_disclosed' | 'superseded'
  | 'awaiting_verification'

export type Status =
  | 'operating' | 'under_construction' | 'consented' | 'pending'
  | 'pre_application' | 'screening' | 'scoping' | 'announced'
  | 'strategic_opportunity' | 'grid_record_only' | 'refused' | 'appealed'
  | 'withdrawn' | 'lapsed' | 'paused' | 'superseded' | 'unknown'

export type MaturityLevel = 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5'
export type Confidence = 'high' | 'medium' | 'low'

/** A sourced numeric claim (min/max variants used across sections). */
export interface QuantityClaim {
  value?: number | null
  min?: number
  max?: number
  minimum_mw?: number
  maximum_mw?: number
  unit?: string
  state?: UncertaintyState
  claimant?: string
  applicable_date?: string
  phase?: string
  confidence?: Confidence
  preferred?: boolean
  preferred_rationale?: string
  notes?: string
  source_ids?: string[]
}

export interface Alias {
  alias: string
  alias_type?: string
  source_ids?: string[]
}

export interface Phase {
  phase_name: string
  phase_number?: number
  description?: string
  status?: string
  target_start_date?: string
  source_ids?: string[]
}

export interface ProjectCore {
  slug: string
  canonical_name: string
  display_name?: string
  aliases?: Alias[]
  summary: string
  project_type?: string
  status: Status
  status_source_ids?: string[]
  maturity_level: MaturityLevel
  maturity_flags?: string[]
  maturity_explanation?: string
  verification_level?: 'verified' | 'reported' | 'unverifiable'
  local_authority: string
  region?: string
  related_project_slugs?: string[]
  first_public_date?: string
  anticipated_construction_start?: string
  anticipated_operational_date?: string
  actual_construction_start?: string
  actual_operational_date?: string
  last_verified_at?: string
  next_review_at?: string
  confidence_overall?: Confidence
  is_public?: boolean
  is_sensitive?: boolean
  phases?: Phase[]
  latest_development?: { date?: string; headline?: string; source_ids?: string[] }
  unknowns?: string[]
}

export interface Site {
  site_name?: string
  address?: string
  postcode?: string
  settlement?: string
  latitude?: number
  longitude?: number
  location_precision?: string
  boundary_precision?: string
  site_area_m2?: QuantityClaim
  gross_floor_area_m2?: QuantityClaim
  building_footprint_m2?: QuantityClaim
  max_building_height_m?: QuantityClaim
  number_of_buildings?: QuantityClaim
  greenfield_brownfield?: string
  green_belt?: boolean
  current_land_use?: string
  previous_land_use?: string
  protected_designations?: string[]
  nearest_settlements?: string[]
  land_notes?: string
  source_ids?: string[]
}

export interface CapacityClaim {
  capacity_type: string
  value_mw?: number | null
  minimum_mw?: number
  maximum_mw?: number
  state: UncertaintyState
  applicable_date?: string
  phase?: string
  claimant?: string
  confidence?: Confidence
  preferred?: boolean
  preferred_rationale?: string
  supersedes?: string
  notes?: string
  source_ids?: string[]
}

export interface EnergyEstimate {
  scenario_name?: string
  phase?: string
  annual_energy_gwh?: number | null
  peak_load_mw?: number
  load_factor?: number
  renewable_claim_percent?: number
  matching_method?: string
  power_purchase_agreement?: string
  onsite_generation?: string
  estimate_type?: string
  methodology?: string
  state?: UncertaintyState
  confidence?: Confidence
  notes?: string
  source_ids?: string[]
}

export interface WaterEstimate {
  cooling_type?: string
  cooling_description?: string
  annual_water_m3?: number | null
  potable_water?: boolean | null
  closed_loop?: boolean | null
  estimate_type?: string
  state?: UncertaintyState
  confidence?: Confidence
  notes?: string
  source_ids?: string[]
}

export interface EconomicClaim {
  claim_category: string
  value?: number | null
  value_min?: number
  value_max?: number
  unit?: string
  geographic_scope?: string
  period?: string
  claimant?: string
  consultant?: string
  methodology?: string
  independently_reviewed?: boolean | null
  binding_status?: string
  state?: UncertaintyState
  confidence?: Confidence
  notes?: string
  source_ids?: string[]
}

export interface PlanningEvent {
  event_date?: string
  event_type?: string
  title?: string
  source_ids?: string[]
}

export interface PlanningCase {
  reference?: string | null
  planning_authority?: string
  application_type?: string
  description?: string
  submission_date?: string
  validation_date?: string
  committee_date?: string
  consultation_deadline?: string
  decision?: string
  decision_date?: string
  decision_notes?: string
  eia_required?: boolean | null
  conditions_summary?: string
  representations?: { objections?: number; supports?: number; as_of_date?: string; notes?: string }
  official_url?: string
  last_checked_at?: string
  events?: PlanningEvent[]
  source_ids?: string[]
}

export interface Organisation {
  name: string
  role?: string
  company_number?: string
  jurisdiction?: string
  website?: string
  ownership_summary?: string
  beneficial_owner_public?: boolean
  valid_from?: string
  confidence?: Confidence
  notes?: string
  source_ids?: string[]
}

export interface CommunityConcern {
  concern: string
  raised_by?: string
  developer_response?: string
  source_ids?: string[]
}

export interface ClaimedBenefit {
  benefit: string
  claimant?: string
  binding_status?: string
  source_ids?: string[]
}

export interface StakeholderPosition {
  stakeholder: string
  stakeholder_type?: string
  position?: string
  date?: string
  source_ids?: string[]
}

export interface Community {
  summary?: string
  principal_concerns?: CommunityConcern[]
  claimed_local_benefits?: ClaimedBenefit[]
  stakeholder_positions?: StakeholderPosition[]
  campaign_groups?: string[]
  consultation_deadline?: string
  planning_authority_contact?: string
  notes?: string
}

export interface Grid {
  connection_status?: string
  network_operator?: string
  nearby_substation?: string
  requested_import_capacity_mw?: QuantityClaim
  reinforcement_required?: boolean | null
  overlaps_other_project?: string
  evidence_basis?: string
  notes?: string
  source_ids?: string[]
}

export interface ProjectRecord {
  project: ProjectCore
  site?: Site
  capacity_claims?: CapacityClaim[]
  energy_estimates?: EnergyEstimate[]
  water_estimates?: WaterEstimate[]
  economic_claims?: EconomicClaim[]
  planning_cases?: PlanningCase[]
  organisations?: Organisation[]
  community?: Community
  grid?: Grid
}

export interface SourceEntry {
  id: string
  title: string
  publisher?: string
  source_type?: string
  url?: string
  publication_date?: string
  retrieved_date?: string
  reliability_tier?: number
  perspective?: string
  status?: string
  notes?: string
}

export interface Constants {
  snapshot_date?: string
  comparisons?: Record<string, { value: number; definition?: string; source?: string }>
  national_context?: Record<string, { value: number; source?: string; note?: string }>
}

export interface Observatory {
  generated_from_snapshot?: string
  constants?: Constants
  projects: ProjectRecord[]
  sources?: Record<string, SourceEntry>
}

/* ---- geo.json ---- */

/** The kinds actually emitted by scripts/build_dataset.py. */
export type GeoKind = 'project_point' | 'boundary' | 'building'

export interface GeoProperties {
  slug?: string
  kind?: GeoKind
  name?: string
  status?: string
  maturity?: string
  height?: number
  location_precision?: string
  /* boundary features (Spatial Hub Scotland, official red lines) */
  reference?: string
  local_auth?: string
  application_type?: string
  is_primary?: boolean
  official_area_m2?: number
  source?: string
  source_id?: string
  licence?: string
  retrieved_date?: string
  [key: string]: unknown
}

export interface GeoFeature {
  type: 'Feature'
  geometry: { type: string; coordinates: unknown }
  properties: GeoProperties
}

export interface GeoCollection {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

/* ---- UI-level derived types ---- */

export type StatusGroup =
  | 'operating' | 'consented' | 'pending' | 'pre_app' | 'refused' | 'speculative'

export type LensId =
  | 'overview' | 'electricity' | 'water' | 'economics' | 'planning' | 'credibility'
