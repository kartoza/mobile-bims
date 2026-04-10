import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';

import Config from 'react-native-config';

const MAPTILER_STYLE_ID = 'hybrid';
const MAPTILER_TILE_SIZE = 256;
const MAPTILER_KEY = Config.MAPTILER_KEY || '';
const MAPTILER_BASE_URL = `https://api.maptiler.com/maps/${MAPTILER_STYLE_ID}/${MAPTILER_TILE_SIZE}`;

export const baseMapLayer = MAPTILER_KEY
  ? `${MAPTILER_BASE_URL}/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : '';

export const baseMapStyleUrl = `https://api.maptiler.com/maps/${MAPTILER_STYLE_ID}/style.json?key=${MAPTILER_KEY}`;

export const riverLayer =
  'https://geoserver.bims.kartoza.com/geoserver/ows?transparent=true&bbox=' +
  '{minX},{minY},{maxX},{maxY}&service=WMS&version=1.1.1&CRS=EPSG:3857&request=' +
  'GetMap&layers=bims:sa_rivers&styles=&width={width}&height={height}&format=image/png';

export const wetlandLayer =
  'https://maps.kartoza.com/geoserver/ows?transparent=true&bbox=' +
  '{minX},{minY},{maxX},{maxY}&service=WMS&version=1.1.1&CRS=EPSG:3857&request=' +
  'GetMap&layers=kartoza:nwm6_beta_v3_20230714&styles=&width={width}&height={height}&format=image/png';

export const getZoomLevel = (longitudeDelta: number) => {
  const angle = 360 / longitudeDelta;
  return Math.round(Math.log(angle) / Math.log(2));
};

// MapLibre-compatible WMS URL for the river layer.
// MapLibre GL Native replaces {bbox-epsg-3857} with the tile's bounding box in EPSG:3857.
export const riverLayerMapLibre =
  'https://geoserver.bims.kartoza.com/geoserver/ows?' +
  'transparent=true&service=WMS&version=1.1.1&request=GetMap' +
  '&layers=bims:sa_rivers&bbox={bbox-epsg-3857}' +
  '&width=256&height=256&srs=EPSG:3857&styles=&format=image%2Fpng';

// Local XYZ tile URL template served from downloaded river tiles
export const localRiverTileUrl = `file://${RNFS.DocumentDirectoryPath}/rivers/{z}/{x}/{y}.png`;

// Probe the overlay tile service.
// For WMS ({bbox-epsg-3857}) URLs, substitutes a concrete bbox; for XYZ/TMS, substitutes z/x/y.
export const probeOverlayTile = async (
  tileUrlTemplate: string,
): Promise<boolean> => {
  try {
    let probeUrl: string;
    if (tileUrlTemplate.includes('{bbox-epsg-3857}')) {
      probeUrl = tileUrlTemplate.replace(
        '{bbox-epsg-3857}',
        '0,0,156543,156543',
      );
    } else {
      probeUrl = tileUrlTemplate
        .replace('{z}', '1')
        .replace('{x}', '1')
        .replace('{-y}', '0')
        .replace('{y}', '1');
    }
    const response = await fetch(probeUrl, {method: 'HEAD'});
    return response.ok;
  } catch {
    return false;
  }
};

// Returns true if a MapLibre log entry represents a tile-fetch timeout for the given source ID
export const isMapLibreSourceTimeout = (
  log: {message?: string; level?: string; tag?: string},
  sourceId: string,
): boolean => {
  const message = log.message ?? '';
  const lower = message.toLowerCase();
  return (
    message.includes(sourceId) &&
    (lower.includes('timeout') || lower.includes('timed out'))
  );
};

// Returns true if any river tiles have been downloaded to local storage
export const hasOfflineRiverTiles = async (): Promise<boolean> => {
  try {
    return await RNFS.exists(`${RNFS.DocumentDirectoryPath}/rivers`);
  } catch {
    return false;
  }
};

async function downloadTile(url: string, path: string) {
  try {
    const dir = path.substring(0, path.lastIndexOf('/'));
    await RNFS.mkdir(dir);
    await RNFetchBlob.config({path}).fetch('GET', url);
  } catch (error) {
    console.error('Error downloading tile:', error);
  }
}

function long2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom),
  );
}

function tile2long(x: number, z: number) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tile2lat(y: number, z: number) {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

const EARTH_RADIUS = 6378137;

function lon2merc(lon: number): number {
  return (lon * Math.PI * EARTH_RADIUS) / 180;
}

function lat2merc(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * EARTH_RADIUS;
}

export async function downloadTiles(region: any, zoom: number) {
  let minZoom = 11;
  const maxZoom = 15;
  if (zoom) {
    minZoom = zoom;
  }
  const minLongitude = region.longitude - region.longitudeDelta / 2;
  const maxLongitude = region.longitude + region.longitudeDelta / 2;
  const minLatitude = region.latitude - region.latitudeDelta / 2;
  const maxLatitude = region.latitude + region.latitudeDelta / 2;

  // eslint-disable-next-line @typescript-eslint/no-shadow
  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const minX = long2tile(minLongitude, zoom);
    const maxX = long2tile(maxLongitude, zoom);
    const minY = lat2tile(maxLatitude, zoom);
    const maxY = lat2tile(minLatitude, zoom);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const west = lon2merc(tile2long(x, zoom));
        const east = lon2merc(tile2long(x + 1, zoom));
        const south = lat2merc(tile2lat(y + 1, zoom));
        const north = lat2merc(tile2lat(y, zoom));
        const url = riverLayer
          .replace('{minX}', String(west))
          .replace('{minY}', String(south))
          .replace('{maxX}', String(east))
          .replace('{maxY}', String(north))
          .replace('{width}', '256')
          .replace('{height}', '256');
        const path = `${RNFS.DocumentDirectoryPath}/rivers/${zoom}/${x}/${y}.png`;
        await downloadTile(url, path);
      }
    }
  }
}
