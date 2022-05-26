/* eslint-disable @typescript-eslint/camelcase */
import { load, save } from "../../utils/storage"
import Well from "./well"
import Site from "./site"

export const loadSites = async () => {
  const sites = await load('sites')
  if (!sites) {
    return []
  }
  return sites.map((site) => new Site(site))
}

export const saveSites = async (sites) => {
  await save("sites", sites)
}

export const getSiteByField = async (field: string, value: any): Promise<Site> => {
  const sites = await load("sites")
  let site = null
  if (sites) {
    for (const index in sites) {
      const _site = sites[index]
      if (_site[field] === value) {
        site = _site
      }
    }
  }
  if (site) {
    return new Site(site)
  }
  return site
}

export const geSitesByField = async (field: string, value: any): Promise<Site[]> => {
  const sites = await load("sites")
  const _sites = []
  if (sites) {
    for (const index in sites) {
      const _well = sites[index]
      if (_well[field] === value) {
        _sites.push(new Site(_well))
      }
    }
  }
  return _sites
}

export const saveWellByField = async (
  queryField: string,
  queryFieldValue: any,
  wellData: Well) => {
  const wells = await load("wells")
  if (wells) {
    for (const index in wells) {
      const _well = wells[index]
      if (_well[queryField] === queryFieldValue) {
        wells[index] = wellData
        break
      }
    }
  }
  await saveWells(wells)
}

export const updateWellMeasurement = async (
  wellPk: any,
  measurementData,
  measurementType) => {
  const well = await getWellByField("pk", wellPk)
  await well.addMeasurementData(measurementType, measurementData)
  await saveWellByField("pk", well.pk, well)
}

export const createNewSite = async (latitude: number, longitude: number) => {
  const newSites = await geSitesByField('newData', true)
  let newPk = -1
  if (newSites.length > 0) {
    // sort by pk
    newSites.sort((a, b) => a.pk - b.pk)
    newPk = newSites[0].pk - 1
  }
  const newWell = new Site({
    pk: newPk,
    latitude: latitude,
    longitude: longitude,
    newData: true,
    editable: true,
    datetime: Math.floor(Date.now() / 1000)
  })
  const allWells = await loadSites()
  allWells.push(newWell)
  await saveSites(allWells)
  return newWell
}

export const clearTemporaryNewSites = async () => {
  const sites = await loadSites()
  const removedIndex = []
  if (sites) {
    for (const index in sites) {
      const _site = sites[index]
      if (_site.newData === true && _site.synced === true) {
        removedIndex.push(index)
      }
    }
  }
  if (removedIndex.length > 0) {
    for (let i = removedIndex.length - 1; i >= 0; i--) {
      sites.splice(removedIndex[i], 1)
    }
    await saveSites(sites)
  }
  return removedIndex.length > 0
}

export const removeWellsByField = async (field: string, value: any) => {
  const wells = await load("wells")
  const removedIndex = []
  if (wells) {
    for (const index in wells) {
      const _well = wells[index]
      if (_well[field] === value) {
        removedIndex.push(index)
      }
    }
  }
  if (removedIndex.length > 0) {
    for (let i = removedIndex.length - 1; i >= 0; i--) {
      wells.splice(removedIndex[i], 1)
    }
    await saveWells(wells)
  }
  return removedIndex.length > 0
}
