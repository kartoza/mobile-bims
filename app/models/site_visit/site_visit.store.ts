import SiteVisit from '../site_visit/site_visit';
import {load, save} from '../../utils/storage';

const _SITE_VISITS_KEY = 'siteVisits';

export const allSiteVisits = async () => {
  const siteVisits = await load(_SITE_VISITS_KEY);
  if (!siteVisits) {
    return [];
  }
  return siteVisits.map((siteVisit: any) => new SiteVisit(siteVisit));
};

export const getSiteVisitsByField = async (
  field: string,
  value: any,
): Promise<SiteVisit[]> => {
  const siteVisits = await load(_SITE_VISITS_KEY);
  const _siteVisits = [];
  if (siteVisits) {
    for (const index in siteVisits) {
      const _siteVisit = siteVisits[index];
      if (_siteVisit[field] === value) {
        _siteVisits.push(new SiteVisit(_siteVisit));
      }
    }
  }
  return _siteVisits;
};

export const saveSiteVisits = async (siteVisits: SiteVisit[]) => {
  await save(_SITE_VISITS_KEY, siteVisits);
};

export const saveSiteVisitByField = async (
  queryField: string,
  queryFieldValue: any,
  siteVisit: SiteVisit,
) => {
  let siteVisits = await load(_SITE_VISITS_KEY);
  let update = false;
  if (siteVisits) {
    for (const index in siteVisits) {
      const _siteVisit = siteVisits[index];
      if (_siteVisit[queryField] === queryFieldValue) {
        siteVisits[index] = siteVisit;
        update = true;
        break;
      }
    }
    if (!update) {
      siteVisits.push(siteVisit);
    }
  } else {
    siteVisits = [siteVisit];
  }
  await saveSiteVisits(siteVisits);
};
