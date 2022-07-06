import Site from "../site/site"
import { TaxonGroup } from "../taxon/taxon"

export default class SiteVisit {
  id: number
  site: Site
  taxonGroup: TaxonGroup
  observedTaxa: any
  samplingMethod: string
  specificBiotope: string
  siteImage: any
  synced: boolean
  newData?: boolean

  parse = (data) => {
    this.id = data.id
    this.site = data.site
    this.taxonGroup = data.taxonGroup
    this.observedTaxa = data.observedTaxa
    this.samplingMethod = data.samplingMethod
    this.specificBiotope = data.specificBiotope
    this.siteImage = data.siteImage
    this.newData = data.newData
    this.synced = data.synced
    return this
  }

  constructor(siteVisit: any) {
    if (siteVisit) {
      for (const key in siteVisit) {
        this[key] = siteVisit[key]
      }
      if (this.newData && typeof siteVisit.synced === "undefined") {
        this.synced = true
      }
    }
  }
}
