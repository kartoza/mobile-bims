import {load, save} from '../../utils/storage';
import Abiotic from './abiotic';

const ABIOTIC_STORAGE_KEY = 'abiotic';

export const loadAbioticData = async () => {
  const abioticData = await load(ABIOTIC_STORAGE_KEY);
  if (!abioticData) {
    return [];
  }
  let _abioticData = [];
  try {
    _abioticData = abioticData.abioticData;
  } catch (e) {}
  return _abioticData.map((abiotic: any) => new Abiotic(abiotic));
};

export const saveAbioticData = async (abioticData: Abiotic[]) => {
  await save(ABIOTIC_STORAGE_KEY, abioticData);
};
