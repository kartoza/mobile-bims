import {Api} from './api';
import {ApiResponse} from 'apisauce';
import {getGeneralApiProblem} from './api-problem';
import Abiotic from '../../models/abiotic/abiotic';

export class AbioticApi extends Api {
  async getAbioticList(): Promise<any> {
    const response: ApiResponse<any> = await this.apisauce.get(
      '/mobile/abiotic-list/',
    );
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      const rawData = response.data;
      const resultAbioticData: Abiotic[] = rawData.map(
        (raw: any) => new Abiotic(raw),
      );
      return {kind: 'ok', abioticData: resultAbioticData};
    } catch (e) {
      return {kind: 'bad-data'};
    }
  }
}
