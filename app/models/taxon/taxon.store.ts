import { load, save } from "../../utils/storage"
import Taxon, { TaxonGroup } from "./taxon"

const _TAXON_GROUPS_KEY = "taxonGroups"
const _TAXA_KEY = "taxa"

const getTaxaKey = (moduleId) => {
  return _TAXA_KEY + moduleId
}

export const saveTaxonGroups = async (taxonGroups) => {
  await save(_TAXON_GROUPS_KEY, taxonGroups)
}

export const loadTaxonGroups = async () => {
  const taxonGroups = await load(_TAXON_GROUPS_KEY)
  if (!taxonGroups) {
    return []
  }
  return taxonGroups.map((taxonGroup) => new TaxonGroup(taxonGroup))
}

export const saveTaxa = async (taxa, moduleId) => {
  await save(getTaxaKey(moduleId), taxa)
}

export const loadTaxa = async (moduleId) => {
  const taxa = await load(getTaxaKey(moduleId))
  if (!taxa) {
    return []
  }
  return taxa.map((taxon) => new Taxon(taxon))
}
