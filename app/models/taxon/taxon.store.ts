import { load, save } from "../../utils/storage"
import Taxon, { TaxonGroup } from "./taxon"

const _TAXON_GROUPS_KEY = "taxonGroups"
const _TAXA_KEY = "taxa"

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

export const saveTaxa = async (taxa) => {
  await save(_TAXA_KEY, taxa)
}

export const loadTaxa = async () => {
  const taxa = await load(_TAXA_KEY)
  if (!taxa) {
    return []
  }
  return taxa.map((taxon) => new Taxon(taxon))
}
