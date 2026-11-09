export interface LayoffRecord {
  record_id: string;
  company_name: string;
  industry: string;
  country: string;
  company_size: string;
  year: number;
  month: number;
  date: string;
  layoffs_count: number;
  workforce_cut_pct: number;
  hiring_status: string;
  ai_impact_factor: number;
  stage: string;
  annual_burn_reduction_usd_m: number;
  headquarters: string;
  source_notes?: string;
}
