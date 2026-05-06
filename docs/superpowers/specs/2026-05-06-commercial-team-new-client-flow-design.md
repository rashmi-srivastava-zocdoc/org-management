# Commercial Team New Client Flow - Interactive Demo

**Date:** 2026-05-06  
**Status:** Approved  
**Location:** Proposed Workflow tab in Org Management prototype

## Overview

Build an interactive demo showing the Commercial Team "New Client" flow. Users can click through mockup screens that simulate the proposed workflow, replacing the current abstract step boxes with a hands-on experience.

## User Flow

```
Accounts List → New → Type Selection → Account Form → Account Detail → Create CSR Account
```

### Step 1: Accounts List

**Screen:** Salesforce-style accounts table

| Element | Description |
|---------|-------------|
| Header | "Step 1 of 3: Start with Prospect" with progress indicator |
| "New" button | Primary action, top-right |
| Search bar | Filter accounts |
| Table columns | Account Name, Account Segment, Practice ID, Phone, Website, Billing State, Last Activity, Is active practice? |
| Sample data | 5-10 mock accounts (Health System, Large Provider Group, Local types) |

**Interaction:** Click "New" → Opens type selection modal

### Step 2a: Type Selection Modal

**Screen:** Modal overlay

| Element | Description |
|---------|-------------|
| Title | "New Account" |
| Radio buttons | Practice (default), Business Development, Health System |
| Buttons | Cancel, Next |

**Interaction:** Select type → Click "Next" → Shows account form

### Step 2b: Account Form

**Screen:** Full form based on selected type

| Element | Description |
|---------|-------------|
| Title | "New Account: [Type]" (e.g., "New Account: Health System") |
| Header fields | Account Owner (pre-filled), Customer Success Team Member, Technical Account Manager, Enterprise Onboarding Partner, Enterprise Support Associate |
| Highlights section | Account Name*, Account Segment (dropdown), Parent Account (search), Primary Account (checkbox), Sub-Segment (calculated), Is active practice?, Mid-Market, Website, Phone, Territory fields |
| Buttons | Cancel, Save & New, Save |

**Interaction:** Fill form → Click "Save" → Shows account detail page

### Step 3: Account Detail Page

**Screen:** Account view with actions

| Element | Description |
|---------|-------------|
| Header | Account name with action buttons |
| Action buttons | Edit, Escalate, Submit to SalesOps, Request Insurance Update, See Practice Page, Change Record Type, **Create CSR Account** (NEW) |
| In-Flight Products | Empty state |
| Eligible Products | Empty state |
| Account Team | Add Default Team, Add Team Members |
| Details tab | Account highlights (name, segment, phone, etc.) |
| Sidebar | Opportunities, Contacts, Cases sections |

**Interaction:** Click "Create CSR Account" → Shows success message → Flow complete

## Technical Implementation

### New Component

Add `CommercialTeamDemo` component to `src/App.tsx` (or extract to separate file).

### State Management

```typescript
type DemoStep = 'list' | 'type-modal' | 'form' | 'detail' | 'success'
type AccountType = 'Practice' | 'BusinessDevelopment' | 'HealthSystem'

const [demoStep, setDemoStep] = useState<DemoStep>('list')
const [selectedType, setSelectedType] = useState<AccountType>('Practice')
const [formData, setFormData] = useState<AccountFormData>({})
```

### Integration

- Add to Proposed Workflow tab under "Commercial Team Flow" section
- Replace current abstract step boxes with "Try Demo" button
- Demo opens in a modal or expands inline

### Styling

- Match Salesforce look and feel from screenshots
- Use existing Zocdoc design tokens where applicable
- Responsive for desktop viewing

## Sample Data

### Mock Accounts (for list view)

| Account Name | Segment | Practice ID | State |
|--------------|---------|-------------|-------|
| Lifestance - Texas | Large Provider Group | 118864 | TX |
| Northwell Health | Health System | 01260000 | NY |
| Privia Health | Large Provider Group | - | WA |
| Tava Health | Local | 137235 | UT |
| Orlando Health | Health System | 75919 | FL |

## Success Criteria

1. User can click through all 4 steps without errors
2. Form fields are interactive (can type/select)
3. Progress indicator shows current step
4. "Create CSR Account" shows success feedback
5. Demo can be restarted

## Future Enhancements (deferred)

- CSR account creation screen details (user will provide later)
- Existing Client Expansion flow
- Customer Flow demo
