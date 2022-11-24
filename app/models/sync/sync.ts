import {load, save} from '../../utils/storage';
import SiteVisit from '../site_visit/site_visit';
import {saveSiteVisitByField} from '../site_visit/site_visit.store';
import {SiteVisitsApi} from '../../services/api/site-visits-api';
import Site from '../site/site';
import {SitesApi} from '../../services/api/sites-api';
import {saveSiteByField} from '../site/site.store';
import SassSiteVisit from "../sass/sass_site_visit";
import {SassApi} from "../../services/api/sass-api";
import {saveSassSiteVisit} from "../sass/sass.store";

export interface SyncData {
  identifier: string;
  id?: string | number;
  data?: any;
  url?: string;
  method?: string;
  wellPk: string | number;
  dataType: any;
}

export const addUnsyncedData = async (data: SyncData) => {
  let storedUnsyncedData = await load('unsynced');
  if ('id' in data && data.id !== '') {
  } else {
    data.id = Date.now();
  }
  if (!storedUnsyncedData) {
    storedUnsyncedData = [data];
  } else {
    storedUnsyncedData.push(data);
  }
  await save('unsynced', storedUnsyncedData);
};

export const getUnsynced = async (): Promise<SyncData[]> => {
  return (await load('unsynced')) || [];
};

// Get synced data from storage
export const getSynced = async () => {
  return (await load('synced')) || {};
};

// Sync local data with the server
export interface SyncResult {
  synced: boolean;
  currentUnsyncedQueue?: any[];
}

/**
 * Push updated site visit to remote server
 */
export const pushUnsyncedSiteVisit = async (siteVisit: SiteVisit) => {
  const api = new SiteVisitsApi();
  await api.setup();
  const oldSiteVisitId = siteVisit.id;
  let apiResult = {} as any;
  if (siteVisit.newData) {
    apiResult = await api.postSiteVisit(siteVisit);
  }
  if (apiResult.kind === 'ok') {
    siteVisit.id = apiResult.siteVisitId;
    siteVisit.synced = true;
    await saveSiteVisitByField('id', oldSiteVisitId, siteVisit);
    return true;
  } else {
    return false;
  }
};

/**
 * Post location site to remote server
 */
export const postLocationSite = async (site: Site) => {
  const api = new SitesApi();
  await api.setup();
  const oldId = site.id;
  const apiResult = await api.postSite(site);
  if (apiResult.kind === 'ok') {
    site.id = apiResult.siteId;
    site.siteCode = apiResult.siteCode;
    site.synced = true;
    await saveSiteByField('id', oldId, site);
    return true;
  } else {
    return false;
  }
};

/**
 * Push SASS site visit to remote server
 */
export const pushUnsyncedSassSiteVisit = async (
  sassSiteVisit: SassSiteVisit,
) => {
  const api = new SassApi();
  await api.setup();
  const oldSiteVisitId = sassSiteVisit.id;
  let apiResult = {} as any;
  if (sassSiteVisit.newData) {
    apiResult = await api.postSassSiteVisit(sassSiteVisit);
  }
  if (apiResult.kind === 'ok') {
    sassSiteVisit.id = apiResult.sassSiteVisitId;
    sassSiteVisit.synced = true;
    await saveSassSiteVisit(sassSiteVisit, 'id', oldSiteVisitId);
    return true;
  } else {
    return false;
  }
};
