export interface ReservationFields {
  'Invoice': string;
  'Event name': string[];
  'Status'?: string[];
  'Starts at'?: string[];
  'Stops at'?: string[];
  'Order': string[];
  'Total': number;
  'Number'?: number;
  'Updated at'?: string;
  'Created at': string;
  'First day'?: number;
  'Second day'?: number;
  'Continuation per day'?: number;
  'Config'?: string[];
  'Conflict Status'?: string;
  "Client's Country"?: string[];
  'VAT %'?: number;
  'Total incl VAT'?: number;
  'Total Distance (km)'?: number[];
  'Name for invoice'?: string[];
  'Description'?: string[];
  'Price calculation'?: string[];
  'Unit'?: string[];
  'Amount'?: number;
}
