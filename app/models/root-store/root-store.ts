import {Instance, SnapshotOut, types} from 'mobx-state-tree';

/**
 * A RootStore model
 */
export const RootStoreModel = types.model('RootStore').props({});

export interface RootStore extends Instance<typeof RootStoreModel> {}

export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
