import Site from '../site/site';
import {TaxonGroup} from '../taxon/taxon';

export interface OccurrencePhoto {
  path: string;
  id: number;
  name?: string;
  taxonId?: number;
}

export default class SiteVisit {
  id?: number;
  site!: Site;
  taxonGroup!: TaxonGroup;
  observedTaxa: any;
  samplingMethod?: string;
  biotope?: string;
  abiotic?: any;
  specificBiotope?: string;
  substratum?: string;
  sourceReferenceId?: string;
  date!: string | Date;
  owner!: string;
  siteImage: any;
  synced?: boolean;
  newData?: boolean;
  recordType?: string;
  occurrencePhotos?: OccurrencePhoto[];

  constructor(siteVisit: any) {
    if (siteVisit) {
      for (const key in siteVisit) {
        // @ts-ignore
        this[key] = siteVisit[key];
      }
      if (this.newData && typeof siteVisit.synced === 'undefined') {
        this.synced = true;
      }
    }
  }
}
