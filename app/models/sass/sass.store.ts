import {load, save} from '../../utils/storage';
import SassSiteVisit from './sass_site_visit';
import SiteVisit from "../site_visit/site_visit";

const SASS_TAXA_KEY = 'sass-taxa';
const SASS_SITE_VISIT_KEY = 'sass-site-visit';

export const saveSassTaxa = async (sassTaxa: any[]) => {
  await save(SASS_TAXA_KEY, sassTaxa);
};

export const loadSassTaxa = async () => {
  const sassTaxa = await load(SASS_TAXA_KEY);
  if (!sassTaxa) {
    return [];
  }
  return sassTaxa.sassTaxa;
};

export const getSassSiteVisitByField = async (
  field: string,
  value: any,
): Promise<SassSiteVisit[]> => {
  const sassSiteVisits = await load(SASS_SITE_VISIT_KEY);
  const _sassSiteVisits = [];
  if (sassSiteVisits) {
    for (const index in sassSiteVisits) {
      const _sassSiteVisit = sassSiteVisits[index];
      if (_sassSiteVisit[field] === value) {
        _sassSiteVisits.push(new SassSiteVisit(_sassSiteVisit));
      }
    }
  }
  return _sassSiteVisits;
};

export const allSassSiteVisits = async () => {
  const sassSiteVisits = await load(SASS_SITE_VISIT_KEY);
  if (!sassSiteVisits) {
    return [];
  }
  return sassSiteVisits.map(
    (sassSiteVisit: any) => new SassSiteVisit(sassSiteVisit),
  );
};

export const saveSassSiteVisits = async (sassSiteVisits: SassSiteVisit[]) => {
  await save(SASS_SITE_VISIT_KEY, sassSiteVisits);
};

export const saveSassSiteVisit = async (
  sassSiteVisit: SassSiteVisit,
  queryField?: string,
  queryFieldValue?: any,
) => {
  let sassSiteVisits = await load(SASS_SITE_VISIT_KEY);
  let update = false;
  if (sassSiteVisits) {
    if (queryField && queryFieldValue) {
      for (const index in sassSiteVisits) {
        const _sassSiteVisit = sassSiteVisits[index];
        if (_sassSiteVisit[queryField] === queryFieldValue) {
          sassSiteVisits[index] = sassSiteVisit;
          update = true;
          break;
        }
      }
    }
    if (!update) {
      sassSiteVisits.push(sassSiteVisit);
    }
  } else {
    sassSiteVisits = [sassSiteVisit];
  }
  await saveSassSiteVisits(sassSiteVisits);
};

export const saveSassSiteVisitByField = async (
  queryField: string,
  queryFieldValue: any,
  sassSiteVisit: SassSiteVisit,
) => {
  let sassSiteVisits = await load(SASS_SITE_VISIT_KEY);
  let update = false;
  if (sassSiteVisits) {
    for (const index in sassSiteVisits) {
      const _siteVisit = sassSiteVisits[index];
      if (_siteVisit[queryField] === queryFieldValue) {
        sassSiteVisits[index] = sassSiteVisit;
        update = true;
        break;
      }
    }
    if (!update) {
      sassSiteVisits.push(sassSiteVisit);
    }
  } else {
    sassSiteVisits = [sassSiteVisit];
  }
  await saveSassSiteVisits(sassSiteVisits);
};

export const removeSassSiteVisitByField = async (
  queryField: string,
  queryFieldValue: any,
) => {
  let sassSiteVisits = await load(SASS_SITE_VISIT_KEY);
  if (sassSiteVisits) {
    for (const index in sassSiteVisits) {
      const _siteVisit = sassSiteVisits[index];
      if (_siteVisit[queryField] === queryFieldValue) {
        sassSiteVisits.splice(index, 1);
      }
    }
  }
  await saveSassSiteVisits(sassSiteVisits);
};
