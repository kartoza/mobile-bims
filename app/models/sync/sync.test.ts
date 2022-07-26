/* eslint-disable @typescript-eslint/camelcase */
import {save} from '../../utils/storage';
import {
  addUnsyncedData,
  getSynced,
  getUnsynced,
} from './sync';

const unsynced = {
  identifier: 'test',
  wellPk: 1,
  dataType: '',
  data: {
    id: '',
    time: 15000000,
    parameter: '1',
    methodology: '12',
    value_id: '',
    value_value: '',
    value_unit: 'm',
  },
};

it('adds to unsynced data', async () => {
  await addUnsyncedData(unsynced);
  const allUnsynced = await getUnsynced();
  expect(allUnsynced[0].identifier).toBe(unsynced.identifier);
  expect(allUnsynced[0].id).not.toBe(null);
});
