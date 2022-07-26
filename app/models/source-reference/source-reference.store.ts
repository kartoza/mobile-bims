import {load, save} from '../../utils/storage';
import SourceReference from './source-reference';

const SOURCE_REFERENCE_KEY = 'source_reference';

export const loadSourceReferences = async () => {
  const source_references = await load(SOURCE_REFERENCE_KEY);
  if (!source_references) {
    return [];
  }
  return source_references.map(
    (source_reference: any) => new SourceReference(source_reference),
  );
};

export const saveSourceReferences = async (
  source_references: SourceReference[],
) => {
  await save(SOURCE_REFERENCE_KEY, source_references);
};
