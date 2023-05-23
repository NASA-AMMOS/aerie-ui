export type PermissibleQueryResponse = {
  mutationType: {
    fields: PermissibleQuery[];
  };
  queryType: {
    fields: PermissibleQuery[];
  };
};

export type PermissibleQuery = {
  name: string;
};
