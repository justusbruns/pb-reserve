export type AirtableResponse<T> = {
  id: string;
  fields: T;
  createdTime: string;
}