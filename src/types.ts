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
