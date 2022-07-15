import Site from "../site/site"
import { TaxonGroup } from "../taxon/taxon"

export default class SiteVisit {
  id: number
  site: Site
  taxonGroup: TaxonGroup
  observedTaxa: any
  samplingMethod: string
  biotope: string
  specificBiotope: string
  substratum: string
  date: string
  owner: string
  siteImage: any
  synced: boolean
  newData?: boolean

  parse = (data) => {
    this.id = data.id
    this.site = data.site
    this.date = data.date
    this.taxonGroup = data.taxonGroup
    this.observedTaxa = data.observedTaxa
    this.samplingMethod = data.samplingMethod
    this.biotope = data.biotope
    this.specificBiotope = data.specificBiotope
    this.substratum = data.substratum
    this.siteImage = data.siteImage
    this.newData = data.newData
    this.synced = data.synced
    this.owner = data.owner
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
