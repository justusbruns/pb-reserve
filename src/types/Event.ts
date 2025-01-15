export interface EventFields {
  'Event name': string;
  'Starts at': string;
  'Stops at': string;
  'Event created by': string;
  'Reserved by'?: string[];
  'Accounts payable clerk'?: string[];
  'Contact person'?: string[];
  'Chauffeur'?: string[];
  'Status': 'concept' | 'started' | 'stopped' | 'reserved';
  'Payment status'?: 'Proposed' | 'Approved' | 'Invoiced' | 'Paid' | 'Invoice requested' | 'Proposal requested';
  'Location'?: string[];
  'Type of Network'?: 'Mobile Router' | 'Ethernet ' | 'Local Wifi';
  'Wifi name'?: string;
  'Wifi password'?: string;
  'Notes'?: string;
  'Tags'?: string[];
  'Outside / Inside'?: '🏠 Inside' | '🏕️ Outside';
  'Languages'?: Array<'Dutch' | 'English' | 'Arabic' | 'Bengali' | 'Bulgarian' | 'Croatian' | 'Czech' | 'French' | 'German' | 'Greek' | 'Hindi' | 'Hungarian' | 'Italian' | 'Mandarin' | 'Polish' | 'Portuguese' | 'Romanian' | 'Russian' | 'Spanish' | 'Slovak'>;
  'Total Distance (km)'?: number;
  'Travel Time'?: number;
  'Estimate #'?: number;
  'Estimate HTML'?: Array<{
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
    width?: number;
    height?: number;
    thumbnails?: {
      small?: { url: string; width: number; height: number };
      large?: { url: string; width: number; height: number };
    };
  }>;
  'Estimate PDF'?: string;
  'Availability'?: string[];
  'Gross total'?: number;
  'Gross total w VAT'?: number;
}