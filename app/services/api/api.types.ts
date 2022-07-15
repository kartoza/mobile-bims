import { GeneralApiProblem } from "./api-problem"
import Well from "../../models/site/well"
import Site from "../../models/site/site"
import Taxon, { TaxonGroup } from "../../models/taxon/taxon"
import Option from "../../models/options/option"
import SiteVisit from "../../models/site_visit/site_visit"

export interface User {
  id: number
  name: string
}

export type GetUsersResult = { kind: "ok"; users: User[] } | GeneralApiProblem
export type GetUserResult = { kind: "ok"; user: User } | GeneralApiProblem
export type GetWellsResult = { kind: "ok"; wells: Well[]; terms: any[] } | GeneralApiProblem
export type GetWellResult = { kind: "ok"; well: Well; terms?: any[] } | GeneralApiProblem
export type GetSiteVisitResult = { kind: "ok"; siteVisit: SiteVisit } | GeneralApiProblem
export type GetSitesResult = { kind: "ok"; sites: Site[]; terms: any[] } | GeneralApiProblem
export type GetSiteResult = { kind: "ok"; site: Site; terms?: any[] } | GeneralApiProblem
export type GetTaxaResult = { kind: "ok"; taxa: Taxon[] } | GeneralApiProblem
export type GetTaxonGroupResult = { kind: "ok"; taxonGroups: TaxonGroup[] } | GeneralApiProblem
export type GetOptionsResult = { kind: "ok"; options: Option[] } | GeneralApiProblem
export type PostSiteVisitResult = { kind: "ok"; siteVisitId: string } | GeneralApiProblem
