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

export type ProductType =
  | 'Marketplace'
  | 'BookFromGoogle'
  | 'Wellhive'
  | 'Yelp'
  | 'Healthgrades'
  | 'ZVS'
  | 'Intake'
  | 'Zo'
  | 'BookableDirectory';

export interface Practice {
  id: string;
  name: string;
  npi?: string;
  numActiveProviders?: number;
  cloudId?: string;
  address?: string;
  city?: string;
  state?: string;
  parentOrgId: string;
  products?: ProductType[];
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
