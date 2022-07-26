export class TaxonGroup {
  id!: number;
  name!: string;
  synced?: boolean;
  newData?: boolean;

  parse = (data: {name: string; id: number}) => {
    this.name = data.name;
    this.id = data.id;
    return this;
  };

  constructor(taxonGroup: any) {
    if (taxonGroup) {
      for (const key in taxonGroup) {
        // @ts-ignore
        this[key] = taxonGroup[key];
      }
      if (this.newData && typeof taxonGroup.synced === 'undefined') {
        this.synced = true;
      }
    }
  }
}

export default class Taxon {
  id!: number;
  canonicalName!: string;
  scientificName?: string;
  synced?: boolean;
  newData?: boolean;

  parse = (data: {
    id: number;
    canonical_name: string;
    scientific_name: string;
  }) => {
    this.id = data.id;
    this.canonicalName = data.canonical_name;
    this.scientificName = data.scientific_name;
    return this;
  };

  constructor(taxon: any) {
    if (taxon) {
      for (const key in taxon) {
        // @ts-ignore
        this[key] = taxon[key];
      }
      if (this.newData && typeof taxon.synced === 'undefined') {
        this.synced = true;
      }
    }
  }
}
