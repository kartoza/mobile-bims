import { GeneralApiProblem } from "./api-problem"
import Well from "../../models/site/well"
import Site from "../../models/site/site"

export interface User {
  id: number
  name: string
}

export type GetUsersResult = { kind: "ok"; users: User[] } | GeneralApiProblem
export type GetUserResult = { kind: "ok"; user: User } | GeneralApiProblem
export type GetWellsResult = { kind: "ok"; wells: Well[]; terms: any[] } | GeneralApiProblem
export type GetWellResult = { kind: "ok"; well: Well; terms?: any[] } | GeneralApiProblem
export type GetSitesResult = { kind: "ok"; sites: Site[]; terms: any[] } | GeneralApiProblem
export type GetSiteResult = { kind: "ok"; site: Site; terms?: any[] } | GeneralApiProblem
