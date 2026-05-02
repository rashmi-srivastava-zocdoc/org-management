export type OrgType = 'HealthSystem' | 'LargeProviderGroup' | 'MidMarket' | 'Local';

export interface Organization {
  id: string;
  salesforceId?: string;
  name: string;
  type: OrgType;
  parentId?: string;
  city?: string;
  state?: string;
  owner?: string;
  providerCount?: number;
  children?: Organization[];
}

export interface Practice {
  id: string;
  name: string;
  npi?: string;
  address?: string;
  city?: string;
  state?: string;
  parentOrgId: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'created' | 'updated' | 'moved' | 'member_added' | 'member_removed';
  field?: string;
  oldValue?: string;
  newValue?: string;
  user: string;
}

export interface Member {
  id: string;
  type: 'Practice' | 'Group' | 'Organization';
  name: string;
}

export type FlowStep =
  | 'home'
  | 'create-org'
  | 'create-org-success'
  | 'add-child-choice'
  | 'add-child-org'
  | 'add-practice'
  | 'search'
  | 'search-results'
  | 'org-detail'
  | 'success';

export interface FlowState {
  step: FlowStep;
  currentOrg?: Organization;
  parentOrg?: Organization;
  searchQuery?: string;
}
