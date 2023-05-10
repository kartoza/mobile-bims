export default class SassSiteVisit {
  id!: number;
  siteId!: number;
  biotope?: any;
  sassTaxa?: any;
  date!: string;
  owner!: string;
  siteImage?: any;
  abiotic?: any;
  synced?: boolean;
  newData?: boolean;
  comments?: string;
  otherBiota?: string;
  accredited?: boolean;
  sourceReferenceId?: string;

  constructor(sassSiteVisit: any) {
    if (sassSiteVisit) {
      for (const key in sassSiteVisit) {
        // @ts-ignore
        this[key] = sassSiteVisit[key];
      }
      if (this.newData && typeof sassSiteVisit.synced === 'undefined') {
        this.synced = true;
      }
    }
  }
}
