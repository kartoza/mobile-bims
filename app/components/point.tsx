import React, {FunctionComponent, memo, useEffect, useState} from 'react';
import {Text, StyleSheet, View, Platform, TouchableOpacity} from 'react-native';
import {Marker as MapsMarker} from 'react-native-maps';
import {MarkerView as MapLibreMarkerView} from '@maplibre/maplibre-react-native';

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
  useMapLibre?: boolean;
}

export const Point: FunctionComponent<Props> = memo(
  ({item, onPress, isAddSite, pinColor, useMapLibre = false}) => {
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

    const coordinate = [
      item.geometry.coordinates[0],
      item.geometry.coordinates[1],
    ] as [number, number];

    if (useMapLibre && Platform.OS === 'android') {
      const isCluster = !!item.properties?.cluster;
      const isSelected = pinColor === 'blue';

      return (
        <MapLibreMarkerView
          key={key}
          coordinate={coordinate}
          anchor={{x: 0.5, y: 0.5}}
          allowOverlap={isCluster || isSelected}
          isSelected={isSelected}>
          <TouchableOpacity
            activeOpacity={0.9}
            hitSlop={0}
            pressRetentionOffset={0}
            style={
              isCluster ? styles.clusterTouchTarget : styles.pointTouchTarget
            }
            onPress={() => {
              if (!isAddSite) {
                onPress(item);
              }
            }}>
            {isCluster ? (
              <View style={styles.clusterMarker}>
                <Text style={styles.clusterMarkerText}>
                  {item.properties.point_count}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.pointMarker,
                  {
                    backgroundColor: pinColor,
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        </MapLibreMarkerView>
      );
    }

    return (
      <MapsMarker
        key={key}
        coordinate={{
          latitude: coordinate[1],
          longitude: coordinate[0],
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
  clusterTouchTarget: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointTouchTarget: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
