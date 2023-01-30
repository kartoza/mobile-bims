export const BiotopeName = {
  sic: 'Stones in current',
  sooc: 'Stones out of current',
  be: 'Bedrock',
  ave: 'Aquatic vegetation',
  mvic: 'Marginal vegetation in current',
  mvoc: 'Marginal vegetation out of current',
  gr: 'Gravel',
  sa: 'Sand',
  smc: 'Silt/mud/clay',
};

export interface SassFormValues {
  id?: number;
  siteId?: number;
  comments?: string | undefined;
  otherBiota?: string | undefined;
  date: Date | null;
  sassTaxa?: any;
  biotope?: any;
}

export const FormInitialValues: SassFormValues = {
  date: new Date(),
  sassTaxa: {},
  biotope: {},
  otherBiota: '',
  comments: '',
};

export type BiotopeObjectKey = keyof typeof BiotopeName;
