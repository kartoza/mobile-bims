import React, {FunctionComponent, memo, useEffect, useState} from 'react';
import {Text, StyleSheet, View} from 'react-native';
import {Marker as MapsMarker, Callout} from 'react-native-maps';

import type * as GeoJSON from 'geojson';
import type {supercluster} from 'react-native-clusterer';
import { color } from '../theme/color';

type IPoint =
  | supercluster.PointFeature<GeoJSON.GeoJsonProperties>
  | supercluster.ClusterFeatureClusterer<GeoJSON.GeoJsonProperties>;

interface Props {
  item: IPoint;
  onPress: (item: IPoint) => void;
  isAddSite: boolean;
  pinColor: string;
}

export const Point: FunctionComponent<Props> = memo(
  ({item, onPress, isAddSite, pinColor}) => {
    const [key, setKey] = useState<string>(
      `${
        item.properties?.cluster_id ?? `point-${item.properties?.key}`
      }-${pinColor}`,
    );

    useEffect(() => {
      setKey(
        `${
          item.properties?.cluster_id ?? `point-${item.properties?.key}`
        }-${pinColor}`,
      );
    }, [pinColor]);

    return (
      <MapsMarker
        key={key}
        coordinate={{
          latitude: item.geometry.coordinates[1],
          longitude: item.geometry.coordinates[0],
        }}
        pinColor={pinColor}
        tracksViewChanges={false}
        onPress={() => {
          if (!isAddSite) {
            return onPress(item);
          }
        }}>
        {item.properties?.cluster ? (
          // Render Cluster
          <View style={styles.clusterMarker}>
            <Text style={styles.clusterMarkerText}>
              {item.properties.point_count}
            </Text>
          </View>
        ) : null}
      </MapsMarker>
    );
  },
  (prevProps, nextProps) =>
    prevProps.pinColor === nextProps.pinColor &&
    prevProps.isAddSite === nextProps.isAddSite &&
    prevProps.item.properties?.cluster_id ===
      nextProps.item.properties?.cluster_id &&
    prevProps.item.properties?.id === nextProps.item.properties?.id &&
    prevProps.item.properties?.point_count ===
      nextProps.item.properties?.point_count &&
    prevProps.item.properties?.onItemPress ===
      nextProps.item.properties?.onItemPress &&
    prevProps.item.properties?.getClusterExpansionRegion ===
      nextProps.item.properties?.getClusterExpansionRegion,
);

const styles = StyleSheet.create({
  calloutContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
  },
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.secondaryFBIS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterMarkerText: {
    color: '#fff',
    fontSize: 16,
  },
});
