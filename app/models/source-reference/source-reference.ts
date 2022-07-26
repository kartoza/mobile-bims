export default class SourceReference {
  id!: number;
  localId!: number;
  sourceName!: string;
  title!: string;
  year?: string;
  authors?: string;
  referenceType!: string;

  constructor(data: any) {
    this.id = data.id;
    this.sourceName = data.source_name;
    this.title = data.title;
    this.year = data.year;
    this.authors = data.authors;
    this.referenceType = data.reference_type;
    if (data.localId) {
      this.localId = data.localId;
    }
    if (!this.localId) {
      this.localId = data.id;
    }
    return this;
  }
}
