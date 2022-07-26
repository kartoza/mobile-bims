import Site from '../site/site';
import {TaxonGroup} from '../taxon/taxon';

export default class SiteVisit {
  id!: number;
  site!: Site;
  taxonGroup!: TaxonGroup;
  observedTaxa: any;
  samplingMethod?: string;
  biotope?: string;
  specificBiotope?: string;
  substratum?: string;
  date!: string;
  owner!: string;
  siteImage: any;
  synced?: boolean;
  newData?: boolean;

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
