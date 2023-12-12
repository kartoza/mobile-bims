import {Api} from './api';
import {GetSourceReferencesResult} from './api.types';
import {ApiResponse} from 'apisauce';
import {getGeneralApiProblem} from './api-problem';
import SourceReference from '../../models/source-reference/source-reference';

export class SourceReferenceApi extends Api {
  /**
   * Get all source references
   */
  async getSourceReferences(): Promise<GetSourceReferencesResult> {
    const response: ApiResponse<any> = await this.apisauce.get(
      '/mobile/source-references/',
    );
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      const rawData = response.data.results;
      const parsedData: SourceReference[] = [];
      rawData.map((sourceReferenceData: object) => {
        parsedData.push(new SourceReference(sourceReferenceData));
      });
      return {kind: 'ok', sourceReferences: parsedData};
    } catch {
      return {kind: 'bad-data'};
    }
  }
}
