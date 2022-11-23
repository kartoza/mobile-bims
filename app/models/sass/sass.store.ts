import {load, save} from '../../utils/storage';

const SASS_TAXA_KEY = 'sass-taxa';

export const saveSassTaxa = async (sassTaxa: any[]) => {
  await save(SASS_TAXA_KEY, sassTaxa);
};

export const loadSassTaxa = async () => {
  const sassTaxa = await load(SASS_TAXA_KEY);
  if (!sassTaxa) {
    return [];
  }
  return sassTaxa.sassTaxa;
};
