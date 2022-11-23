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
  date: Date | null;
  sic: string;
  sooc: string;
  be: string;
  ave: string;
  mvic: string;
  mvoc: string;
  gr: string;
  sa: string;
  smc: string;
  sassTaxa?: any
}

export const FormInitialValues: SassFormValues = {
  date: new Date(),
  sic: '',
  sooc: '',
  be: '',
  ave: '',
  mvic: '',
  mvoc: '',
  gr: '',
  sa: '',
  smc: '',
  sassTaxa: {},
};

export type BiotopeObjectKey = keyof typeof BiotopeName;
