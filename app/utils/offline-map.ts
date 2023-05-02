import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';

export const riverLayer =
  'https://maps.kartoza.com/geoserver/ows?transparent=true&bbox=' +
  '{minX},{minY},{maxX},{maxY}&service=WMS&version=1.1.1&CRS=EPSG:3857&request=' +
  'GetMap&layers=kartoza:sa_rivers&styles=&width={width}&height={height}&format=image/png';

export const getZoomLevel = (longitudeDelta: number) => {
  const angle = 360 / longitudeDelta;
  return Math.round(Math.log(angle) / Math.log(2));
};

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

function toWebMercator(lon: number, lat: number) {
  const x = (lon * 20037508.34) / 180;
  const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  const yWebMercator = (y * 20037508.34) / 180;
  return {lon: x, lat: yWebMercator};
}

async function downloadTile(url: string, path: string) {
  try {
    await RNFetchBlob.config({
      fileCache: true,
      appendExt: 'png',
      path: path,
    })
      .fetch('GET', url)
      .then(res => {
        // the temp file path
        console.log('The file saved to ', res.path());
      });
  } catch (error) {
    console.error('Error downloading tile:', error);
  }
}

export async function downloadTiles(region: any, zoom: number) {
  // Define the region and zoom levels you want to download
  let minZoom = 11;
  let maxZoom = 15;
  if (zoom) {
    minZoom = zoom;
  }
  const minLongitude = region.longitude - region.longitudeDelta / 2;
  const maxLongitude = region.longitude + region.longitudeDelta / 2;
  const minLatitude = region.latitude - region.latitudeDelta / 2;
  const maxLatitude = region.latitude + region.latitudeDelta / 2;

  // Calculate the tile coordinates and download the tiles
  // eslint-disable-next-line @typescript-eslint/no-shadow
  for (let zoom = minZoom; zoom <= maxZoom; zoom++) {
    const minX = long2tile(minLongitude, zoom);
    const maxX = long2tile(maxLongitude, zoom);
    const minY = lat2tile(maxLatitude, zoom);
    const maxY = lat2tile(minLatitude, zoom);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const west = tile2long(x, zoom);
        const east = tile2long(x + 1, zoom);
        const south = tile2lat(y + 1, zoom);
        const north = tile2lat(y, zoom);
        // Download and save the tile
        const url = riverLayer
          .replace('{minX}', '' + west)
          .replace('{minY}', '' + south)
          .replace('{maxX}', '' + east)
          .replace('{maxY}', '' + north)
          .replace('{width}', '256')
          .replace('{height}', '256')
          .replace('3857', '4326');
        const path = `${RNFS.DocumentDirectoryPath}/rivers/${zoom}/${x}/${y}.png`;
        await downloadTile(url, path);
      }
    }
  }
}
