export default class Site {
  id: number;
  localId?: number;
  siteCode?: string;
  name?: string;
  latitude?: number = 0;
  longitude?: number = 0;
  datetime?: any;
  synced: boolean | undefined;
  newData?: boolean;
  description?: string;

  constructor(data: {
    id: number;
    localId?: number;
    site_code?: string;
    siteCode?: string;
    name?: string;
    geometry?: any | null;
    latitude?: number | null;
    longitude?: number | null;
    datetime: any;
    newData: boolean;
    description?: string;
  }) {
    if (this.newData && typeof this.synced === 'undefined') {
      this.synced = true;
    }
    this.name = data.name;
    this.id = data.id;
    if (data.site_code) {
      this.siteCode = data.site_code;
    } else if (data.siteCode) {
      this.siteCode = data.siteCode;
    } else {
      this.siteCode = '-';
    }
    if (data.geometry) {
      const geometry = JSON.parse(data.geometry);
      this.longitude = geometry.coordinates[0];
      this.latitude = geometry.coordinates[1];
    }
    if (data.latitude && data.longitude) {
      this.longitude = data.longitude;
      this.latitude = data.latitude;
    }
    if (data.datetime) {
      this.datetime = data.datetime;
    }
    if (typeof data.newData !== 'undefined') {
      this.newData = data.newData;
    }
    if (data.description) {
      this.description = data.description;
    }
    if (data.localId) {
      this.localId = data.localId;
    }
    if (!this.localId) {
      this.localId = this.id;
    }
    return this;
  }
}
