import type { ObjectiveId } from './objectives';

export interface WeakSpotMeta {
  label: string;
  blurb: string;
  relatedObjectives: readonly ObjectiveId[];
}

export const WEAK_SPOTS = {
  'cloud-models': {
    label: 'Cloud service models',
    blurb: 'IaaS vs PaaS vs SaaS, and which workloads land where.',
    relatedObjectives: ['1.11'],
  },
  'tkip-vs-aes': {
    label: 'TKIP vs AES',
    blurb: 'WPA2/WPA3 always use AES. TKIP is the legacy WPA1 cipher.',
    relatedObjectives: ['2.3'],
  },
  'what-first': {
    label: '"What FIRST" methodology',
    blurb: 'CompTIA troubleshooting order. Establish theory before action.',
    relatedObjectives: ['3.1', '3.2', '3.3', '3.4'],
  },
  'elimination-clues': {
    label: 'Elimination clues in long scenarios',
    blurb: 'Finding the disqualifying detail buried in multi-paragraph MC stems.',
    relatedObjectives: [],
  },
  'malware-10-step': {
    label: '10-step V15 malware removal',
    blurb: 'The V15-specific 10-step procedure. NOT the 7-step 1102 version.',
    relatedObjectives: ['2.6'],
  },
  'ai-content': {
    label: 'AI content',
    blurb: 'Bias, hallucinations, accuracy; private vs public LLM data concerns.',
    relatedObjectives: ['4.10'],
  },
  'new-malware': {
    label: 'New malware types',
    blurb: 'Cryptominer, stalkerware, fileless, boot-sector. All new on V15.',
    relatedObjectives: ['2.4'],
  },
  'modern-security': {
    label: 'Modern security concepts',
    blurb: 'Quishing, XDR, Zero Trust, PAM, Just-in-Time access.',
    relatedObjectives: ['2.1', '2.4', '2.5'],
  },
  'wpa3': {
    label: 'WPA3 details',
    blurb: 'Forward secrecy, SAE/Dragonfly handshake, opportunistic encryption.',
    relatedObjectives: ['2.3'],
  },
  'active-directory': {
    label: 'Active Directory',
    blurb: 'Domain join, OUs, Group Policy, home folders, log-in scripts.',
    relatedObjectives: ['2.2'],
  },
  'macos-features': {
    label: 'macOS features',
    blurb: 'Time Machine, FileVault, Keychain, Spotlight, Mission Control, Continuity.',
    relatedObjectives: ['1.8'],
  },
  'change-cmdb-sla': {
    label: 'Change management, CMDB, SLA',
    blurb: 'Change types, rollback plans, asset databases, internal vs external SLAs.',
    relatedObjectives: ['4.1', '4.2'],
  },
} as const satisfies Record<string, WeakSpotMeta>;

export type WeakSpotTag = keyof typeof WEAK_SPOTS;

export const WEAK_SPOT_TAGS = Object.keys(WEAK_SPOTS) as WeakSpotTag[];

export function isWeakSpotTag(value: string): value is WeakSpotTag {
  return value in WEAK_SPOTS;
}
