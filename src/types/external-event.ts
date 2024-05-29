export type ExternalEvent = ExternalEventSchema;

export type ExternalEventInsertInput = Pick<ExternalEventSchema, 'id'>;

export type ExternalEventSchema = {
  id: number;
};
