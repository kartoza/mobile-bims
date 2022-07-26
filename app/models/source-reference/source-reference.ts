export default class SourceReference {
  id!: number;
  localId!: number;
  sourceName!: string;
  title!: string;
  year?: string;
  authors?: string;
  referenceType!: string;

  constructor(data: any) {
    for (const key in data) {
      // @ts-ignore
      this[key] = data[key];
    }
    if (data.reference_type) {
      this.referenceType = data.reference_type;
    }
    if (data.source_name) {
      this.sourceName = data.source_name;
    }
    if (!this.localId) {
      this.localId = data.id;
    }
    return this;
  }

  label() {
    return `${this.title}\n(${this.referenceType})`;
  }
}
