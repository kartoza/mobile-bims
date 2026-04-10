import {load, save} from '../../utils/storage';
import SiteVisit from '../site_visit/site_visit';
import {saveSiteVisitByField} from '../site_visit/site_visit.store';
import {SiteVisitsApi} from '../../services/api/site-visits-api';
import Site from '../site/site';
import {SitesApi} from '../../services/api/sites-api';
import {saveSiteByField} from '../site/site.store';
import SassSiteVisit from '../sass/sass_site_visit';
import {SassApi} from '../../services/api/sass-api';
import {saveSassSiteVisit} from '../sass/sass.store';
import {GeneralApiProblem} from '../../services/api/api-problem';

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

export interface SyncErrorInfo {
  kind: string;
  status?: number;
  message: string;
  debugMessage: string;
  updatedAt: string;
}

export interface SyncAttemptResult {
  ok: boolean;
  error?: SyncErrorInfo;
}

const buildSyncError = (
  problem: GeneralApiProblem | {kind?: string; message?: string; status?: number},
  fallbackMessage: string,
): SyncErrorInfo => {
  const message = problem?.message || fallbackMessage;
  const detailParts = [message];

  if (problem?.status) {
    detailParts.push(`HTTP ${problem.status}`);
  }
  if (problem?.kind) {
    detailParts.push(`Problem: ${problem.kind}`);
  }

  return {
    kind: problem?.kind || 'unknown',
    status: problem?.status,
    message,
    debugMessage: detailParts.join('\n'),
    updatedAt: new Date().toISOString(),
  };
};

const clearSyncError = (record: Site | SiteVisit | SassSiteVisit) => {
  if ('syncError' in record) {
    delete record.syncError;
  }
};

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
    clearSyncError(siteVisit);
    await saveSiteVisitByField('id', oldSiteVisitId, siteVisit);
    return {ok: true} as SyncAttemptResult;
  } else {
    siteVisit.syncError = buildSyncError(
      apiResult,
      'Failed to sync site visit.',
    );
    await saveSiteVisitByField('id', oldSiteVisitId, siteVisit);
    return {
      ok: false,
      error: siteVisit.syncError,
    } as SyncAttemptResult;
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
    clearSyncError(site);
    await saveSiteByField('id', oldId, site);
    return {ok: true} as SyncAttemptResult;
  } else {
    site.syncError = buildSyncError(apiResult, 'Failed to sync location site.');
    await saveSiteByField('id', oldId, site);
    return {
      ok: false,
      error: site.syncError,
    } as SyncAttemptResult;
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
    clearSyncError(sassSiteVisit);
    await saveSassSiteVisit(sassSiteVisit, 'id', oldSiteVisitId);
    return {ok: true} as SyncAttemptResult;
  } else {
    sassSiteVisit.syncError = buildSyncError(
      apiResult,
      'Failed to sync SASS data.',
    );
    await saveSassSiteVisit(sassSiteVisit, 'id', oldSiteVisitId);
    return {
      ok: false,
      error: sassSiteVisit.syncError,
    } as SyncAttemptResult;
  }
};
