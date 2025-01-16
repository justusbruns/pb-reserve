import { base } from './config';

interface Availability {
    id?: string;
    Availability: 'Available' | 'Not Available' | 'Maybe Available';
    Chauffeurs: string[];
    Event: string[];
    Remarks?: string;
}

const TABLE_NAME = 'Availability';

export const availabilityService = {
    async getByEventAndChauffeur(eventId: string, chauffeurId: string): Promise<Availability | null> {
        try {
            console.log('Fetching availability for:', { eventId, chauffeurId });
            // Get all records and filter in code since Airtable formulas for linked records are unreliable
            const records = await base(TABLE_NAME)
                .select()
                .all();

            console.log('All records:', records);

            // Find the record where Event and Chauffeurs arrays contain our IDs
            const matchingRecord = records.find(record => {
                const eventIds = Array.isArray(record.fields.Event) ? record.fields.Event : [record.fields.Event];
                const chauffeurIds = Array.isArray(record.fields.Chauffeurs) ? record.fields.Chauffeurs : [record.fields.Chauffeurs];
                
                return eventIds.includes(eventId) && chauffeurIds.includes(chauffeurId);
            });

            console.log('Found matching record:', matchingRecord);

            if (matchingRecord) {
                return {
                    id: matchingRecord.id,
                    Availability: matchingRecord.fields.Availability as Availability['Availability'],
                    Chauffeurs: Array.isArray(matchingRecord.fields.Chauffeurs) ? matchingRecord.fields.Chauffeurs : [matchingRecord.fields.Chauffeurs],
                    Event: Array.isArray(matchingRecord.fields.Event) ? matchingRecord.fields.Event : [matchingRecord.fields.Event],
                    Remarks: matchingRecord.fields.Remarks
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching availability:', error);
            throw error;
        }
    },

    async upsertAvailability(
        chauffeurId: string,
        eventId: string,
        status: Availability['Availability'],
        remarks?: string
    ): Promise<Availability> {
        try {
            console.log('Upserting availability:', { chauffeurId, eventId, status, remarks });
            const existing = await this.getByEventAndChauffeur(eventId, chauffeurId);

            if (existing?.id) {
                console.log('Updating existing record:', existing.id);
                // Update existing record
                const record = await base(TABLE_NAME).update([{
                    id: existing.id,
                    fields: {
                        Availability: status,
                        Remarks: remarks || ''
                    }
                }]);

                return {
                    id: record[0].id,
                    Availability: record[0].fields.Availability,
                    Chauffeurs: Array.isArray(record[0].fields.Chauffeurs) ? record[0].fields.Chauffeurs : [record[0].fields.Chauffeurs],
                    Event: Array.isArray(record[0].fields.Event) ? record[0].fields.Event : [record[0].fields.Event],
                    Remarks: record[0].fields.Remarks
                };
            } else {
                console.log('Creating new record');
                // Create new record
                const record = await base(TABLE_NAME).create([{
                    fields: {
                        Availability: status,
                        Chauffeurs: [chauffeurId],
                        Event: [eventId],
                        Remarks: remarks || ''
                    }
                }]);

                return {
                    id: record[0].id,
                    Availability: record[0].fields.Availability,
                    Chauffeurs: Array.isArray(record[0].fields.Chauffeurs) ? record[0].fields.Chauffeurs : [record[0].fields.Chauffeurs],
                    Event: Array.isArray(record[0].fields.Event) ? record[0].fields.Event : [record[0].fields.Event],
                    Remarks: record[0].fields.Remarks
                };
            }
        } catch (error) {
            console.error('Error upserting availability:', error);
            throw error;
        }
    }
};
