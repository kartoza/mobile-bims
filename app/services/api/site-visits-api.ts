import {Api} from './api';
import SiteVisit from '../../models/site_visit/site_visit';
import {PostSiteVisitResult} from './api.types';
import {ApiResponse} from 'apisauce';
import {getGeneralApiProblem} from './api-problem';
import {getSiteByField} from '../../models/site/site.store';
import RNFS from "react-native-fs";

const imageToBase64 = async (imageUri: string) => {
  const response = await fetch('file://' + imageUri);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      reader.abort();
      reject(new Error('Problem parsing input file.'));
    };
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
};

export class SiteVisitsApi extends Api {
  /**
   * Parse site visit data to post data
   */
  async parseSiteVisit(siteVisit: SiteVisit): Promise<{}> {
    let site = await getSiteByField('localId', siteVisit.site.id);
    if (!site) {
      site = siteVisit.site;
    }
    let date = siteVisit.date;
    if (typeof siteVisit.date === 'string') {
      date = siteVisit.date.split('T')[0];
    }
    const postData: any = {
      date: date,
      owner: siteVisit.owner,
      hydroperiod: siteVisit.hydroperiod,
      record_type: siteVisit.recordType,
      abundance_type: 'number',
      biotope: siteVisit.biotope,
      specific_biotope: siteVisit.specificBiotope,
      substratum: siteVisit.substratum,
      sampling_method: siteVisit.samplingMethod,
      source_reference_id: siteVisit.sourceReferenceId,
      site_image: siteVisit.siteImage,
      abiotic: siteVisit.abiotic,
      sampling_effort_type: siteVisit.samplingEffotMeasure,
      sampling_effort: siteVisit.samplingEffortValue,
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
    if (siteVisit.occurrencePhotos) {
      let base64Images = [];
      for (const occurrencePhoto of siteVisit.occurrencePhotos) {
        const base64Image = await imageToBase64(occurrencePhoto.path);
        base64Images.push({
          id: occurrencePhoto.taxonId,
          base64Image: base64Image,
        });
      }
      postData.occurrence_photos = base64Images;
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
    } else {
      // delete images from the local storage if exist
      if (siteVisit.occurrencePhotos) {
        for (const occurrencePhoto of siteVisit.occurrencePhotos) {
          RNFS.unlink(occurrencePhoto.path)
            .then(() => {
              console.log('File deleted');
            })
            .catch(err => {
              console.error('Failed to delete file:', err);
              return;
            });
        }
      }
    }
    try {
      return {kind: 'ok', siteVisitId: response.data.survey_id};
    } catch {
      return {kind: 'bad-data'};
    }
  }
}
