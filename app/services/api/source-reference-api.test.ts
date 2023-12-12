import MockAdapter from 'axios-mock-adapter';
import {SourceReferenceApi} from './source-reference-api';
import {source_references_api_data} from '../../models/source-reference/source-reference.test';

it('fetches source references', async () => {
  const sourceReferenceApi = new SourceReferenceApi();
  await sourceReferenceApi.setup();
  // @ts-ignore
  const mock = new MockAdapter(sourceReferenceApi.apisauce.axiosInstance);
  mock
    .onGet('/mobile/source-references/')
    .reply(200, source_references_api_data);
  const apiResult = await sourceReferenceApi.getSourceReferences();
  expect(apiResult.kind).toBe('ok');
  if (apiResult.kind === 'ok') {
    expect(apiResult.sourceReferences[0].localId).toBe(
      source_references_api_data.results[0].id,
    );
  }
});
