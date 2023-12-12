import {Api} from './api';
import {GetTaxaResult, GetTaxonGroupResult} from './api.types';
import {ApiResponse} from 'apisauce';
import {getGeneralApiProblem} from './api-problem';
import Taxon, {TaxonGroup} from '../../models/taxon/taxon';

export class TaxaApi extends Api {
  /**
   * Get taxon group
   */
  async getTaxonGroup(): Promise<GetTaxonGroupResult> {
    const response: ApiResponse<any> = await this.apisauce.get(
      '/mobile/taxon-group/',
    );
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      const rawData = response.data;
      const resultTaxa: TaxonGroup[] = rawData.map((raw: any) =>
        new TaxonGroup({}).parse(raw),
      );
      return {kind: 'ok', taxonGroups: resultTaxa};
    } catch (e) {
      return {kind: 'bad-data'};
    }
  }

  /**
   * Get taxa list
   */
  async getTaxa(module = ''): Promise<GetTaxaResult> {
    const response: ApiResponse<any> = await this.apisauce.get(
      `/mobile/all-taxa/?module=${module}`,
    );
    if (!response.ok) {
      const problem = getGeneralApiProblem(response);
      if (problem) {
        return problem;
      }
    }
    try {
      const rawData = response.data;
      const resultTaxa: Taxon[] = rawData.map((raw: any) =>
        new Taxon({}).parse(raw),
      );
      return {kind: 'ok', taxa: resultTaxa};
    } catch (e) {
      return {kind: 'bad-data'};
    }
  }
}
