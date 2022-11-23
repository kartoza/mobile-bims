import {Api} from './api';
import {ApiResponse} from 'apisauce';
import {getGeneralApiProblem} from './api-problem';

export class SassApi extends Api {
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
