import {GeneralApiProblem} from './api-problem';
import Site from '../../models/site/site';
import Taxon, {TaxonGroup} from '../../models/taxon/taxon';
import Option from '../../models/options/option';
// import Option from '../../models/options/option';

export interface User {
  id: number;
  name: string;
}

export type GetUsersResult = {kind: 'ok'; users: User[]} | GeneralApiProblem;
export type GetUserResult = {kind: 'ok'; user: User} | GeneralApiProblem;
export type GetSitesResult = {kind: 'ok'; sites: Site[]} | GeneralApiProblem;
export type GetSiteResult = {kind: 'ok'; site: Site} | GeneralApiProblem;
export type GetTaxaResult = {kind: 'ok'; taxa: Taxon[]} | GeneralApiProblem;
export type GetTaxonGroupResult =
  | {kind: 'ok'; taxonGroups: TaxonGroup[]}
  | GeneralApiProblem;
export type GetOptionsResult =
  | {kind: 'ok'; options: Option[]}
  | GeneralApiProblem;
export type PostSiteVisitResult =
  | {kind: 'ok'; siteVisitId: string}
  | GeneralApiProblem;
export type PostLocationSiteResult =
  | {kind: 'ok'; siteId: number; siteCode: string}
  | GeneralApiProblem;
