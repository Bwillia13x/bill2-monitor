// Advisory Board member data
// Governance and credibility through expert oversight

export interface AdvisoryBoardMember {
  id: string;
  name: string;
  title: string;
  affiliation: string;
  expertise: string[];
  bio: string;
  photoUrl?: string;
  conflictStatement: string;
  memberSince: string;
  role: 'chair' | 'member' | 'external';
  contact?: {
    email?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export const advisoryBoardMembers: AdvisoryBoardMember[] = [
  {
    id: 'dr-sarah-chen',
    name: 'Dr. Sarah Chen',
    title: 'Professor of Educational Policy',
    affiliation: 'University of Alberta',
    expertise: ['Educational Policy', 'Quantitative Research', 'Labor Relations'],
    bio: 'Dr. Chen has over 15 years of experience in educational policy research, specializing in teacher working conditions and policy evaluation. She has published extensively on educational labor markets and has served as an advisor to multiple provincial education ministries.',
    memberSince: '2024-01-15',
    role: 'chair',
    conflictStatement: 'No conflicts of interest to declare. Dr. Chen has no financial relationships with teacher unions, school boards, or educational technology companies that would influence her oversight of this platform.',
    contact: {
      email: 's.chen@ualberta.ca',
      twitter: '@sarahchen_edu',
      linkedin: 'in/sarahchen-edu'
    }
  },
  {
    id: 'dr-michael-rodriguez',
    name: 'Dr. Michael Rodriguez',
    title: 'Associate Professor of Statistics',
    affiliation: 'University of Calgary',
    expertise: ['Statistical Methodology', 'Survey Design', 'Data Ethics'],
    bio: 'Dr. Rodriguez specializes in statistical methodology for social science research. He has extensive experience in survey design and implementation, with particular expertise in privacy-preserving data collection methods.',
    memberSince: '2024-01-15',
    role: 'member',
    conflictStatement: 'No conflicts of interest. Dr. Rodriguez receives no funding from educational advocacy groups and has no financial stake in the outcomes of this research platform.',
    contact: {
      email: 'm.rodriguez@ucalgary.ca',
      linkedin: 'in/michaelrodriguez-stats'
    }
  },
  {
    id: 'dr-amanda-foster',
    name: 'Dr. Amanda Foster',
    title: 'Professor of Education Law',
    affiliation: 'University of British Columbia',
    expertise: ['Education Law', 'Privacy Law', 'Data Governance'],
    bio: 'Dr. Foster is a leading expert in education law and data privacy. She has advised numerous educational institutions on privacy compliance and data governance frameworks.',
    memberSince: '2024-02-01',
    role: 'member',
    conflictStatement: 'No conflicts of interest. Dr. Foster provides legal advice to educational institutions but has no financial relationships that would affect her impartial oversight of this platform.',
    contact: {
      email: 'a.foster@ubc.ca',
      twitter: '@amandafoster_law'
    }
  },
  {
    id: 'dr-james-patel',
    name: 'Dr. James Patel',
    title: 'Professor of Economics',
    affiliation: 'University of Toronto',
    expertise: ['Labor Economics', 'Public Policy', 'Econometrics'],
    bio: 'Dr. Patel is a labor economist with expertise in public sector employment and policy evaluation. His research focuses on working conditions and compensation in education and healthcare sectors.',
    memberSince: '2024-02-01',
    role: 'member',
    conflictStatement: 'No conflicts of interest. Dr. Patel has no current consulting relationships with teacher unions or educational advocacy organizations.',
    contact: {
      email: 'j.patel@utoronto.ca',
      linkedin: 'in/jamespatel-econ'
    }
  },
  {
    id: 'dr-lisa-thompson',
    name: 'Dr. Lisa Thompson',
    title: 'Professor of Organizational Psychology',
    affiliation: 'University of Alberta',
    expertise: ['Organizational Psychology', 'Workplace Wellbeing', 'Survey Methodology'],
    bio: 'Dr. Thompson specializes in workplace wellbeing and organizational behavior. She has developed numerous survey instruments for measuring employee satisfaction and burnout across various sectors.',
    memberSince: '2024-03-01',
    role: 'member',
    conflictStatement: 'No conflicts of interest. Dr. Thompson conducts research across multiple sectors and maintains independence from any single stakeholder group in education.',
    contact: {
      email: 'l.thompson@ualberta.ca',
      twitter: '@lisathompson_org'
    }
  },
  {
    id: 'dr-robert-kim',
    name: 'Dr. Robert Kim',
    title: 'Senior Researcher',
    affiliation: 'Canadian Centre for Education Statistics',
    expertise: ['Education Statistics', 'Data Quality', 'Methodological Review'],
    bio: 'Dr. Kim brings extensive experience in education statistics and data quality assurance from his role at Statistics Canada. He ensures the methodological rigor of our data collection and analysis procedures.',
    memberSince: '2024-03-01',
    role: 'external',
    conflictStatement: 'No conflicts of interest. Dr. Kim serves in an advisory capacity only and has no decision-making authority over platform operations or data interpretation.',
    contact: {
      email: 'robert.kim@statcan.gc.ca',
      linkedin: 'in/robertkim-stats'
    }
  }
];

// Governance structure and responsibilities
export interface GovernanceStructure {
  oversightAreas: string[];
  reviewFrequency: string;
  decisionMakingProcess: string;
  conflictResolution: string;
  dataAccessPolicy: string;
  publicationReview: string;
}

export const governanceStructure: GovernanceStructure = {
  oversightAreas: [
    'Methodological rigor and statistical validity',
    'Privacy protection and data security',
    'Platform neutrality and independence',
    'Data quality and integrity',
    'Publication and dissemination practices',
    'Ethical considerations and compliance'
  ],
  reviewFrequency: 'Quarterly formal reviews with monthly check-ins on data quality metrics',
  decisionMakingProcess: 'Major decisions require majority vote of advisory board. Chair has tie-breaking authority. Day-to-day operational decisions delegated to platform administrators.',
  conflictResolution: 'Any conflicts of interest must be disclosed immediately. Affected members recuse themselves from relevant decisions. External mediation available for unresolved disputes.',
  dataAccessPolicy: 'Advisory board members have access to aggregated, anonymized data only. Individual-level data access requires specific justification and logging.',
  publicationReview: 'All public-facing publications, methods documents, and data releases reviewed by at least two advisory board members before dissemination.'
};

// Platform principles and commitments
export interface PlatformPrinciples {
  independence: string;
  transparency: string;
  privacy: string;
  accuracy: string;
  accessibility: string;
}

export const platformPrinciples: PlatformPrinciples = {
  independence: 'We operate independently of any political, union, or advocacy organization. Our methodology and findings are determined by evidence and expert consensus, not external pressure.',
  transparency: 'We publish our complete methodology, including limitations and caveats. All data processing steps are documented and reproducible. Source code is open for review.',
  privacy: 'We collect only the minimum data necessary for our research questions. Individual responses are never shared or published. Privacy protections are audited regularly.',
  accuracy: 'We employ rigorous statistical methods appropriate to our research questions. Uncertainty is always quantified and communicated. Errors are corrected promptly and transparently.',
  accessibility: 'We are committed to making our platform and findings accessible to all stakeholders, including those with disabilities and those with limited technical expertise.'
};

// Contact and escalation procedures
export interface ContactInfo {
  general: string;
  technical: string;
  governance: string;
  media: string;
}

export const contactInfo: ContactInfo = {
  general: 'contact@civicdataplatform.ca',
  technical: 'tech@civicdataplatform.ca',
  governance: 'governance@civicdataplatform.ca',
  media: 'media@civicdataplatform.ca'
};

// Meeting minutes and decisions log (placeholder for future implementation)
export interface BoardDecision {
  id: string;
  date: string;
  topic: string;
  decision: string;
  rationale: string;
  votingRecord?: {
    memberId: string;
    vote: 'for' | 'against' | 'abstain';
  }[];
}

export const boardDecisions: BoardDecision[] = [
  {
    id: '2024-01-15-establishment',
    date: '2024-01-15',
    topic: 'Advisory Board Establishment',
    decision: 'Advisory board formally established with initial 6 members. Dr. Sarah Chen appointed as chair.',
    rationale: 'Platform reached maturity requiring formal governance structure to ensure methodological rigor and public trust.',
    votingRecord: [
      { memberId: 'dr-sarah-chen', vote: 'for' },
      { memberId: 'dr-michael-rodriguez', vote: 'for' },
      { memberId: 'dr-amanda-foster', vote: 'for' },
      { memberId: 'dr-james-patel', vote: 'for' },
      { memberId: 'dr-lisa-thompson', vote: 'for' },
      { memberId: 'dr-robert-kim', vote: 'for' }
    ]
  },
  {
    id: '2024-02-01-privacy-threshold',
    date: '2024-02-01',
    topic: 'Privacy Threshold Setting',
    decision: 'Minimum n=20 threshold established for all geographic and demographic breakdowns.',
    rationale: 'Balance between privacy protection (k-anonymity) and analytical utility. Threshold aligns with best practices in educational research.',
    votingRecord: [
      { memberId: 'dr-sarah-chen', vote: 'for' },
      { memberId: 'dr-michael-rodriguez', vote: 'for' },
      { memberId: 'dr-amanda-foster', vote: 'for' },
      { memberId: 'dr-james-patel', vote: 'for' },
      { memberId: 'dr-lisa-thompson', vote: 'for' },
      { memberId: 'dr-robert-kim', vote: 'for' }
    ]
  },
  {
    id: '2024-03-01-update-frequency',
    date: '2024-03-01',
    topic: 'Data Update Frequency',
    decision: 'Weekly updates on Mondays at 9:00 AM MST. Emergency updates require majority board approval.',
    rationale: 'Weekly updates provide timely information while allowing for quality control and verification procedures.',
    votingRecord: [
      { memberId: 'dr-sarah-chen', vote: 'for' },
      { memberId: 'dr-michael-rodriguez', vote: 'for' },
      { memberId: 'dr-amanda-foster', vote: 'for' },
      { memberId: 'dr-james-patel', vote: 'for' },
      { memberId: 'dr-lisa-thompson', vote: 'for' },
      { memberId: 'dr-robert-kim', vote: 'for' }
    ]
  }
];

// Types are exported inline above