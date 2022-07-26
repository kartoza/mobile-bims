import {load, save} from '../../utils/storage';
import Site from './site';

const SITE_STORAGE_KEY = 'sites';

export const loadSites = async () => {
  const sites = await load(SITE_STORAGE_KEY);
  if (!sites) {
    return [];
  }
  return sites.map((site: any) => new Site(site));
};

export const saveSites = async (sites: Site[]) => {
  await save(SITE_STORAGE_KEY, sites);
};

export const saveSiteByField = async (
  queryField: string,
  queryFieldValue: any,
  site: Site,
) => {
  let sites = await load(SITE_STORAGE_KEY);
  let update = false;
  if (sites) {
    for (const index in sites) {
      const _site = sites[index];
      if (_site[queryField] === queryFieldValue) {
        sites[index] = site;
        update = true;
        break;
      }
    }
    if (!update) {
      sites.push(site);
    }
  } else {
    sites = [site];
  }
  await saveSites(sites);
};

export const getSiteByField = async (
  field: string,
  value: any,
): Promise<Site> => {
  const sites = await load(SITE_STORAGE_KEY);
  let site = null;
  if (sites) {
    for (const index in sites) {
      const _site = sites[index];
      if (_site[field] === value) {
        site = _site;
      }
    }
  }
  if (site) {
    return new Site(site);
  }
  return site;
};

export const getSitesByField = async (
  field: string,
  value: any,
): Promise<Site[]> => {
  const sites = await load(SITE_STORAGE_KEY);
  const _sites = [];
  if (sites) {
    for (const index in sites) {
      const _site = sites[index];
      if (_site[field] === value) {
        _sites.push(new Site(_site));
      }
    }
  }
  return _sites;
};

export const createNewSite = async (
  latitude: number,
  longitude: number,
): Promise<Site> => {
  const newSites = await getSitesByField('synced', true);
  let newId = -1;
  if (newSites.length > 0) {
    newSites.sort((a, b) => a.id - b.id);
    newId = newSites[0].id - 1;
  }
  const newSite = new Site({
    id: newId,
    latitude: latitude,
    longitude: longitude,
    newData: true,
    datetime: Math.floor(Date.now() / 1000),
  });
  const allSites = await loadSites();
  allSites.push(newSite);
  await saveSites(allSites);
  return newSite;
};

export const clearTemporaryNewSites = async () => {
  const sites = await loadSites();
  const removedIndex = [];
  if (sites) {
    for (const index in sites) {
      const _site = sites[index];
      if (_site.newData === true) {
        removedIndex.push(index);
      }
    }
  }
  if (removedIndex.length > 0) {
    for (let i = removedIndex.length - 1; i >= 0; i--) {
      sites.splice(removedIndex[i], 1);
    }
    await saveSites(sites);
  }
  return removedIndex.length > 0;
};
