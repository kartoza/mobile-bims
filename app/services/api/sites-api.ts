import {Api} from './api';
import Site from '../../models/site/site';
import {GetSitesResult, PostLocationSiteResult} from './api.types';
import {getGeneralApiProblem} from './api-problem';
import {ApiResponse} from 'apisauce';

const SITES_LIMIT = 100;

export class SitesApi extends Api {
  /**
   * Post location site
   */
  async postSite(site: Site): Promise<PostLocationSiteResult> {
    const postData = {
      date: site.datetime,
      latitude: site.latitude,
      longitude: site.longitude,
      site_code: site.siteCode,
      user_site_code: site.userSiteCode,
      description: site.description,
      river_name: site.riverName,
      user_river_name: site.userRiverName,
      additional_data: '{ "source": "mobile" }',
      ecosystem_type: site.ecosystemType,
      wetland_name: site.wetlandName,
      user_wetland_name: site.userWetlandName,
      wetland_data: site.wetlandData,
    };
    const url = '/mobile/add-location-site/';
    const response: ApiResponse<any> = await this.apisauce.post(url, postData);
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      return {
        kind: 'ok',
        siteId: response.data.id,
        siteCode: response.data.site_code,
      };
    } catch {
      return {kind: 'bad-data'};
    }
  }

  /**
   * Fetch nearest sites
   */
  async fetchSites(
    latitude: Number,
    longitude: Number,
    extent: string = '',
  ): Promise<GetSitesResult> {
    // make the api call
    const limit = SITES_LIMIT ? `limit=${SITES_LIMIT}` : '';
    let userCoordinate = '';
    if (extent) {
      userCoordinate = `extent=${extent}`;
    } else {
      if (latitude && longitude) {
        userCoordinate = `lat=${latitude}&lon=${longitude}`;
      }
    }
    const apiUrl = `/mobile/nearest-sites/?${userCoordinate}&${limit}`;
    const response: ApiResponse<any> = await this.apisauce.get(apiUrl);
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    // transform the data into the format we are expecting
    try {
      const rawData = response.data;
      const resultSites: Site[] = rawData.map((raw: any) => new Site(raw));
      return {kind: 'ok', sites: resultSites};
    } catch {
      return {kind: 'bad-data'};
    }
  }
}
