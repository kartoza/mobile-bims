export default class Site {
  id: number;
  localId?: number;
  siteCode?: string;
  name?: string;
  latitude?: number = 0;
  longitude?: number = 0;
  datetime?: any;
  synced: boolean | undefined;
  newData?: boolean; // temporary data
  description?: string;
  river_name?: string;
  riverName?: string;
  owner?: string;
  userRiverName?: string;
  userSiteCode?: string;
  ecosystemType?: string;
  userWetlandName?: string;
  wetlandName?: string;

  constructor(data: {
    id: number;
    localId?: number;
    site_code?: string;
    siteCode?: string;
    user_site_code?: string;
    user_river_name?: string;
    name?: string;
    geometry?: any | null;
    latitude?: number | null;
    longitude?: number | null;
    datetime: any;
    newData: boolean;
    description?: string;
    riverName?: string;
    river_name?: string;
    userRiverName?: string;
    userSiteCode?: string;
    synced: boolean;
    owner?: string;
    ecosystemType?: string;
    userWetlandName?: string;
    wetlandName?: string;
  }) {
    if (this.newData && typeof this.synced === 'undefined') {
      this.synced = false;
    }
    this.name = data.name ? data.name : '';
    this.id = data.id;
    if (data.site_code) {
      this.siteCode = data.site_code;
    } else if (data.siteCode) {
      this.siteCode = data.siteCode;
    } else {
      this.siteCode = '-';
    }
    this.latitude =
      data.latitude ||
      (data.geometry ? JSON.parse(data.geometry).coordinates[1] : 0);
    this.longitude =
      data.longitude ||
      (data.geometry ? JSON.parse(data.geometry).coordinates[0] : 0);

    if (data.datetime) {
      this.datetime = data.datetime;
    }
    if (typeof data.newData !== 'undefined') {
      this.newData = data.newData;
    }
    if (typeof data.synced !== 'undefined') {
      this.synced = data.synced;
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
    if (data.river_name) {
      this.riverName = data.river_name;
    } else if (data.riverName) {
      this.riverName = data.riverName;
    }
    if (data.userRiverName) {
      this.userRiverName = data.userRiverName;
    } else if (data.user_river_name) {
      this.userRiverName = data.user_river_name;
    }
    if (data.userSiteCode) {
      this.userSiteCode = data.userSiteCode;
    } else if (data.user_site_code) {
      this.userSiteCode = data.user_site_code;
    }
    if (data.owner) {
      this.owner = data.owner;
    }
    if (data.ecosystemType) {
      this.ecosystemType = data.ecosystemType;
    }
    this.wetlandName = data.wetlandName;
    this.userWetlandName = data.userWetlandName;

    return this;
  }
}
