export type Domain = 1 | 2 | 3 | 4;

export type ObjectiveId =
  | '1.1' | '1.2' | '1.3' | '1.4' | '1.5' | '1.6'
  | '1.7' | '1.8' | '1.9' | '1.10' | '1.11'
  | '2.1' | '2.2' | '2.3' | '2.4' | '2.5' | '2.6'
  | '2.7' | '2.8' | '2.9' | '2.10' | '2.11'
  | '3.1' | '3.2' | '3.3' | '3.4'
  | '4.1' | '4.2' | '4.3' | '4.4' | '4.5'
  | '4.6' | '4.7' | '4.8' | '4.9' | '4.10';

export interface ObjectiveMeta {
  id: ObjectiveId;
  domain: Domain;
  title: string;
  estimatedMinutes: number;
}

export const DOMAIN_NAMES: Record<Domain, string> = {
  1: 'Operating Systems',
  2: 'Security',
  3: 'Software Troubleshooting',
  4: 'Operational Procedures',
};

export const DOMAIN_PERCENT: Record<Domain, number> = {
  1: 28,
  2: 28,
  3: 23,
  4: 21,
};

export const OBJECTIVES: ObjectiveMeta[] = [
  // Domain 1
  { id: '1.1', domain: 1, title: 'Explain common operating system (OS) types and their purposes', estimatedMinutes: 12 },
  { id: '1.2', domain: 1, title: 'Given a scenario, perform OS installations and upgrades in a diverse environment', estimatedMinutes: 15 },
  { id: '1.3', domain: 1, title: 'Compare and contrast basic features of Microsoft Windows editions', estimatedMinutes: 10 },
  { id: '1.4', domain: 1, title: 'Given a scenario, use Microsoft Windows operating system features and tools', estimatedMinutes: 15 },
  { id: '1.5', domain: 1, title: 'Given a scenario, use the appropriate Microsoft command-line tools', estimatedMinutes: 15 },
  { id: '1.6', domain: 1, title: 'Given a scenario, configure Microsoft Windows settings', estimatedMinutes: 12 },
  { id: '1.7', domain: 1, title: 'Given a scenario, configure Microsoft Windows networking features on a client/desktop', estimatedMinutes: 12 },
  { id: '1.8', domain: 1, title: 'Explain common features and tools of the macOS/desktop operating system', estimatedMinutes: 12 },
  { id: '1.9', domain: 1, title: 'Identify common features and tools of the Linux client/desktop operating system', estimatedMinutes: 12 },
  { id: '1.10', domain: 1, title: 'Given a scenario, install applications according to requirements', estimatedMinutes: 8 },
  { id: '1.11', domain: 1, title: 'Given a scenario, install and configure cloud-based productivity tools', estimatedMinutes: 8 },

  // Domain 2
  { id: '2.1', domain: 2, title: 'Summarize various security measures and their purposes', estimatedMinutes: 18 },
  { id: '2.2', domain: 2, title: 'Given a scenario, configure and apply basic Microsoft Windows OS security settings', estimatedMinutes: 15 },
  { id: '2.3', domain: 2, title: 'Compare and contrast wireless security protocols and authentication methods', estimatedMinutes: 10 },
  { id: '2.4', domain: 2, title: 'Summarize types of malware and tools/methods for detection, removal, and prevention', estimatedMinutes: 12 },
  { id: '2.5', domain: 2, title: 'Compare and contrast common social engineering attacks, threats, and vulnerabilities', estimatedMinutes: 15 },
  { id: '2.6', domain: 2, title: 'Given a scenario, implement procedures for basic small office/home office (SOHO) malware removal', estimatedMinutes: 10 },
  { id: '2.7', domain: 2, title: 'Given a scenario, apply workstation security options and hardening techniques', estimatedMinutes: 12 },
  { id: '2.8', domain: 2, title: 'Given a scenario, apply common methods for securing mobile devices', estimatedMinutes: 10 },
  { id: '2.9', domain: 2, title: 'Compare and contrast common data destruction and disposal methods', estimatedMinutes: 8 },
  { id: '2.10', domain: 2, title: 'Given a scenario, apply security settings on SOHO wireless and wired networks', estimatedMinutes: 12 },
  { id: '2.11', domain: 2, title: 'Given a scenario, configure relevant security settings in a browser', estimatedMinutes: 10 },

  // Domain 3
  { id: '3.1', domain: 3, title: 'Given a scenario, troubleshoot common Windows OS issues', estimatedMinutes: 12 },
  { id: '3.2', domain: 3, title: 'Given a scenario, troubleshoot common mobile OS and application issues', estimatedMinutes: 10 },
  { id: '3.3', domain: 3, title: 'Given a scenario, troubleshoot common mobile OS and application security issues', estimatedMinutes: 10 },
  { id: '3.4', domain: 3, title: 'Given a scenario, troubleshoot common personal computer (PC) security issues', estimatedMinutes: 10 },

  // Domain 4
  { id: '4.1', domain: 4, title: 'Given a scenario, implement best practices associated with documentation and support systems information management', estimatedMinutes: 12 },
  { id: '4.2', domain: 4, title: 'Given a scenario, apply change management procedures', estimatedMinutes: 10 },
  { id: '4.3', domain: 4, title: 'Given a scenario, implement workstation backup and recovery methods', estimatedMinutes: 10 },
  { id: '4.4', domain: 4, title: 'Given a scenario, use common safety procedures', estimatedMinutes: 8 },
  { id: '4.5', domain: 4, title: 'Summarize environmental impacts and local environment controls', estimatedMinutes: 8 },
  { id: '4.6', domain: 4, title: 'Explain the importance of prohibited content/activity and privacy, licensing, and policy concepts', estimatedMinutes: 12 },
  { id: '4.7', domain: 4, title: 'Given a scenario, use proper communication techniques and professionalism', estimatedMinutes: 10 },
  { id: '4.8', domain: 4, title: 'Explain the basics of scripting', estimatedMinutes: 8 },
  { id: '4.9', domain: 4, title: 'Given a scenario, use remote access technologies', estimatedMinutes: 10 },
  { id: '4.10', domain: 4, title: 'Explain basic concepts related to artificial intelligence (AI)', estimatedMinutes: 8 },
];

export const OBJECTIVES_BY_ID: Record<ObjectiveId, ObjectiveMeta> =
  Object.fromEntries(OBJECTIVES.map((o) => [o.id, o])) as Record<ObjectiveId, ObjectiveMeta>;

export const OBJECTIVES_BY_DOMAIN: Record<Domain, ObjectiveMeta[]> = {
  1: OBJECTIVES.filter((o) => o.domain === 1),
  2: OBJECTIVES.filter((o) => o.domain === 2),
  3: OBJECTIVES.filter((o) => o.domain === 3),
  4: OBJECTIVES.filter((o) => o.domain === 4),
};

export function isObjectiveId(value: string): value is ObjectiveId {
  return value in OBJECTIVES_BY_ID;
}
