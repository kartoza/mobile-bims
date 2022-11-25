import {Api} from './api';
import SiteVisit from '../../models/site_visit/site_visit';
import {PostSiteVisitResult} from './api.types';
import {ApiResponse} from 'apisauce';
import {getGeneralApiProblem} from './api-problem';
import {getSiteByField} from '../../models/site/site.store';

export class SiteVisitsApi extends Api {
  /**
   * Parse site visit data to post data
   */
  async parseSiteVisit(siteVisit: SiteVisit): Promise<{}> {
    let site = await getSiteByField('localId', siteVisit.site.id);
    if (!site) {
      site = siteVisit.site;
    }
    const postData: any = {
      date: siteVisit.date.split('T')[0],
      owner: siteVisit.owner,
      record_type: 'mobile',
      abundance_type: 'number',
      biotope: siteVisit.biotope,
      specific_biotope: siteVisit.specificBiotope,
      substratum: siteVisit.substratum,
      sampling_method: siteVisit.samplingMethod,
      source_reference_id: siteVisit.sourceReferenceId,
      site_image: siteVisit.siteImage,
      abiotic: siteVisit.abiotic,
      'site-id': site.id,
      'taxa-id-list': '',
    };
    if (Object.keys(siteVisit.observedTaxa).length > 0) {
      const taxaIdList = [];
      for (const taxonId of Object.keys(siteVisit.observedTaxa)) {
        taxaIdList.push(taxonId);
        postData[`${taxonId}-observed`] = 'True';
        postData[`${taxonId}-abundance`] = siteVisit.observedTaxa[taxonId];
      }
      postData['taxa-id-list'] = taxaIdList.join(',');
    }
    return postData;
  }

  /**
   * Post a site visit
   */
  async postSiteVisit(siteVisit: SiteVisit): Promise<PostSiteVisitResult> {
    // make the api call
    const postData = await this.parseSiteVisit(siteVisit);
    const url = '/mobile/add-site-visit/';
    const response: ApiResponse<any> = await this.apisauce.post(url, postData);
    // the typical ways to die when calling an api
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      return {kind: 'ok', siteVisitId: response.data.survey_id};
    } catch {
      return {kind: 'bad-data'};
    }
  }
}
