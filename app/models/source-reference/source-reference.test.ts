import SourceReference from './source-reference';
import {
  saveSourceReferences,
  loadSourceReferences,
} from './source-reference.store';

export const source_references_api_data = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      source_name: 'Test Source Name',
      title: 'Source Title',
      reference_source: 'Reference Source',
      year: '-',
      authors: '-',
      reference_type: 'Unpublished data',
      link_template: '-',
    },
    {
      id: 2,
      source_name: 'Test Source Name 2',
      title: 'Source Title 2',
      reference_source: 'Reference Source',
      year: '2004',
      authors: '-',
      reference_type: 'Database',
      link_template: '-',
    },
  ],
};

it('creates new source reference object', () => {
  const sourceReferenceResults = source_references_api_data.results;
  const sourceReference = new SourceReference(sourceReferenceResults[0]);
  expect(sourceReference.referenceType).toBe('Unpublished data');
  expect(sourceReference.localId).toBe(sourceReferenceResults[0].id);
});

it('saves source references', async () => {
  const sourceReferenceResults = source_references_api_data.results;
  const sourceReferences: SourceReference[] = [];
  sourceReferenceResults.map(sourceReferenceData => {
    sourceReferences.push(new SourceReference(sourceReferenceData));
  });
  await saveSourceReferences(sourceReferences);
  const sourceReferencesFromStorage = await loadSourceReferences();
  expect(sourceReferencesFromStorage.length).toBe(2);
  expect(sourceReferencesFromStorage[1].localId).toBe(
    sourceReferenceResults[1].id,
  );
  expect(sourceReferencesFromStorage[1].referenceType).toBe(
    sourceReferenceResults[1].reference_type,
  );
});
