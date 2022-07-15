/* eslint-disable @typescript-eslint/camelcase */
import { ApisauceInstance, create, ApiResponse } from "apisauce"
import { getGeneralApiProblem } from "./api-problem"
import { ApiConfig, DEFAULT_API_CONFIG } from "./api-config"
import * as Types from "./api.types"
import { load } from "../../utils/storage"
import Well from "../../models/site/well"
import { loadChoices } from "../../models/site/term.store"
import { LIMIT } from "@env"
import { securedUrl } from "../../utils/url"
import Site from "../../models/site/site"
import { GetSitesResult, GetTaxonGroupResult } from "./api.types"
import Taxon, { TaxonGroup } from "../../models/taxon/taxon"
import Option from "../../models/options/option"
import SiteVisit from "../../models/site_visit/site_visit"
import { doc } from "prettier"

/**
 * Manages all requests to the API.
 */
export class Api {
  /**
   * The underlying apisauce instance which performs the requests.
   */
  apisauce: ApisauceInstance

  /**
   * Configurable options.
   */
  config: ApiConfig

  /**
   * Creates the api.
   *
   * @param config The configuration to use.
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
  }

  /**
   * Sets up the API.  This will be called during the bootup
   * sequence and will happen before the first React component
   * is mounted.
   *
   * Be as quick as possible in here.
   */
  async setup() {
    // construct the apisauce instance
    const uuid = await load("token")
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
        Authorization: `Token ${uuid}`
      },
    })
  }

  /**
   * Gets a list of users.
   */
  async getUsers(): Promise<Types.GetUsersResult> {
    // make the api call
    const response: ApiResponse<any> = await this.apisauce.get(`/users`)

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    const convertUser = (raw) => {
      return {
        id: raw.id,
        name: raw.name,
      }
    }

    // transform the data into the format we are expecting
    try {
      const rawUsers = response.data
      const resultUsers: Types.User[] = rawUsers.map(convertUser)
      return { kind: "ok", users: resultUsers }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets a single user by ID
   */

  async getUser(id: string): Promise<Types.GetUserResult> {
    // make the api call
    const response: ApiResponse<any> = await this.apisauce.get(`/users/${id}`)

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const resultUser: Types.User = {
        id: response.data.id,
        name: response.data.name,
      }
      return { kind: "ok", user: resultUser }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Get taxon group
   */
  async getTaxonGroup(): Promise<Types.GetTaxonGroupResult> {
    const response: ApiResponse<any> = (
      await this.apisauce.get(`/mobile/taxon-group/`)
    )
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }
    try {
      const rawData = response.data
      const resultTaxa: TaxonGroup[] = rawData.map((raw) => new TaxonGroup({}).parse(raw))
      return { kind: "ok", taxonGroups: resultTaxa }
    } catch (e) {
      return { kind: "bad-data" }
    }
  }

  /**
   * Get taxa list
   */
  async getTaxa(module = ""): Promise<Types.GetTaxaResult> {
    const response: ApiResponse<any> = (
      await this.apisauce.get(`/mobile/all-taxa/?module=${module}`)
    )
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }
    try {
      const rawData = response.data
      const resultTaxa: Taxon[] = rawData.map((raw) => new Taxon({}).parse(raw))
      return { kind: "ok", taxa: resultTaxa }
    } catch (e) {
      return { kind: "bad-data" }
    }
  }

  /**
   * Get nearest sites
   */
  async getSites(latitude = "", longitude = ""): Promise<Types.GetSitesResult> {
    // make the api call
    const limit = LIMIT ? `limit=${LIMIT}` : ''
    let userCoordinate = ""
    if (latitude && longitude) {
      userCoordinate = `lat=${latitude}&lon=${longitude}`
    }
    const apiUrl = `/mobile/nearest-sites/?${userCoordinate}&${limit}`
    const response: ApiResponse<any> = await this.apisauce.get(
      apiUrl
    )
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }
    // transform the data into the format we are expecting
    try {
      const rawData = response.data
      const resultSites: Site[] = rawData.map((raw) => new Site({}).parse(raw))
      return { kind: "ok", sites: resultSites, terms: rawData.terms }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Get all options
   */
  async getOptions(moduleId: number): Promise<Types.GetOptionsResult> {
    const response: ApiResponse<any> = await this.apisauce.get(
      `/mobile/choices/?module=${moduleId}`
    )
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }
    try {
      const rawData = response.data
      const parsedData = []
      Object.keys(rawData).forEach((key, index) => {
        rawData[key].map(optionData => {
          parsedData.push(new Option({}).parse(optionData, key, moduleId))
        })
      })
      return { kind: "ok", options: parsedData }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Gets a single well by ID
   */

  async getWell(id: string): Promise<Types.GetWellResult> {
    // make the api call
    const response: ApiResponse<any> = await this.apisauce.get(`/groundwater/api/well/minimized/?limit=2&pks=${id}`)

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      const raw = response.data
      return { kind: "ok", well: new Well({}).convertFromMinimizedData(raw.results[0]) }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Parse site visit data to post data
   */
  parseSiteVisit(siteVisit: SiteVisit): {} {
    const postData = {
      date: siteVisit.date.split('T')[0],
      owner: siteVisit.owner,
      record_type: 'mobile',
      abundance_type: 'number',
      biotope: siteVisit.biotope,
      specific_biotope: siteVisit.specificBiotope,
      substratum: siteVisit.substratum,
      sampling_method: siteVisit.samplingMethod,
      site_image: siteVisit.siteImage,
      'site-id': siteVisit.site.id,
      'taxa-id-list': '',
    }
    if (Object.keys(siteVisit.observedTaxa).length > 0) {
      const taxaIdList = []
      for (const taxonId of Object.keys(siteVisit.observedTaxa)) {
        taxaIdList.push(taxonId)
        postData[`${taxonId}-observed`] = "True"
        postData[`${taxonId}-abundance`] = siteVisit.observedTaxa[taxonId]
      }
      postData['taxa-id-list'] = taxaIdList.join(',')
    }
    return postData
  }

  /**
   * Update a single well
   */
  async putWell(siteVisit: SiteVisit): Promise<Types.GetSiteVisitResult> {
    // make the api call
    const postData = this.parseSiteVisit(siteVisit)
    const url = `/groundwater/api/well/minimized/${well.pk}/edit`
    const response: ApiResponse<any> = await this.apisauce.put(
      url,
      postData
    )

    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }

    // transform the data into the format we are expecting
    try {
      return { kind: "ok", well: new Well({}).convertFromMinimizedData(response.data) }
    } catch {
      return { kind: "bad-data" }
    }
  }

  /**
   * Post a site visit
   */
  async postSiteVisit(siteVisit: SiteVisit): Promise<Types.PostSiteVisitResult> {
    // make the api call
    const postData = this.parseSiteVisit(siteVisit)
    const url = `/mobile/add-site-visit/`
    const response: ApiResponse<any> = await this.apisauce.post(
      url,
      postData
    )
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
    }
    try {
      return { kind: "ok", siteVisitId: response.data.survey_id }
    } catch {
      return { kind: "bad-data" }
    }
  }
}
