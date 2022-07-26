import {Api} from './api';
import {GetOptionsResult} from './api.types';
import {ApiResponse} from 'apisauce';
import {getGeneralApiProblem} from './api-problem';
import Option from '../../models/options/option';

export class OptionsApi extends Api {
  /**
   * Get all options
   */
  async getOptions(moduleId: number): Promise<GetOptionsResult> {
    const response: ApiResponse<any> = await this.apisauce.get(
      `/mobile/choices/?module=${moduleId}`,
    );
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      const rawData = response.data;
      const parsedData: any[] = [];
      Object.keys(rawData).forEach(key => {
        rawData[key].map((optionData: {id: number; name: string}) => {
          parsedData.push(new Option({}).parse(optionData, key, moduleId));
        });
      });
      return {kind: 'ok', options: parsedData};
    } catch {
      return {kind: 'bad-data'};
    }
  }
}
