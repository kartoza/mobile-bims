import {Api} from './api';
import {ApiResponse} from 'apisauce';
import {getGeneralApiProblem} from './api-problem';
import SassSiteVisit from '../../models/sass/sass_site_visit';

export class SassApi extends Api {
  /**
   * Post a site visit
   */
  async postSassSiteVisit(sassSiteVisit: SassSiteVisit): Promise<any> {
    const url = '/mobile/add-sass/';
    console.log('sassSitevisit');
    const response: ApiResponse<any> = await this.apisauce.post(
      url,
      sassSiteVisit,
    );
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      return {kind: 'ok', sassSiteVisitId: response.data.id};
    } catch {
      return {kind: 'bad-data'};
    }
  }

  async getSassTaxa(): Promise<any> {
    const response: ApiResponse<any> = await this.apisauce.get(
      '/mobile/sass-taxa-list/',
    );
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      const rawData = response.data;
      return {kind: 'ok', sassTaxa: rawData};
    } catch (e) {
      return {kind: 'bad-data'};
    }
  }
}
