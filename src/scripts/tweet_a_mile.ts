import fs from 'fs';
import TwitterApi from 'twitter-api-v2';
import { config } from 'dotenv';

import { getFilePath, getProFilePath, metersToFeet, getTrailArg, getDistance, getTwitterClientConfig } from './utils';

config();

type MediaType = 'png' | 'gif';

async function go() {
  const trailArg = getTrailArg();

  if (!trailArg) {
    return;
  }

  const DISTANCE = getDistance(trailArg);

  const twitterClientConfig = getTwitterClientConfig(trailArg);
  const client = new TwitterApi(twitterClientConfig);

  for (let mile = 1; mile <= DISTANCE; mile++) {
    console.log(`Processing mile ${mile}`);

    const geojsonFilePath = getFilePath(trailArg, mile, 'geojson');
    const file = fs.readFileSync(geojsonFilePath);
    const section = JSON.parse(file.toString());
    const { geocode, has_tweeted, elevation_difference, max_elevation } = section.properties;

    if (!has_tweeted) {
      console.log(`Tweet mile ${mile}`);
      const statusParts = [];
      const placeParts = [];
      for (let i = 0; i < geocode.length; i++) {
        const geocodeItem = geocode[i];

        if (geocodeItem.id.includes('place') || geocodeItem.id.includes('region')) {
          placeParts.push(geocodeItem.text);
        }
      }

      const mileageText = `Mile ${mile}`;

      if (placeParts.length > 0) {
        statusParts.push(`${mileageText}: ${placeParts.join(', ')}`);
      } else {
        statusParts.push(mileageText);
      }

      const elevGainFeetDisplay = parseInt(metersToFeet(elevation_difference).toFixed(), 10).toLocaleString();
      const elevGainMetersDisplay = parseInt(elevation_difference.toFixed()).toLocaleString();
      statusParts.push(`Elevation gain: ${elevGainFeetDisplay} ft (${elevGainMetersDisplay} m)`);

      const maxElevFeetDisplay = parseInt(metersToFeet(max_elevation).toFixed(0)).toLocaleString();
      const maxElevMetersDisplay = parseInt(max_elevation.toFixed(0)).toLocaleString();
      statusParts.push(`Max elevation: ${maxElevFeetDisplay} ft (${maxElevMetersDisplay} m)`);

      const status = statusParts.join('\n');
      console.log(status)
      let mediaFilePath = getFilePath(trailArg, mile, 'png');
      // getProFilePath - get it? i'm so sorry about this.
      let profileFilePath = getProFilePath(trailArg, mile, 'png');
      let media = fs.readFileSync(mediaFilePath);
      let profile = fs.readFileSync(profileFilePath);
      let mediaType: MediaType = 'png';

      try {
        mediaFilePath = getFilePath(trailArg, mile, 'gif');
        media = fs.readFileSync(mediaFilePath);
        mediaType = 'gif';
      } catch (error) {
        console.log('No gif found');
      }

      try {
        console.log("starting image upload")
        let mediaIds
        if (mediaType = 'png') {
          mediaIds = await Promise.all([
            // upload map
            client.v1.uploadMedia(media, { type: mediaType }),
            // upload profile chart
            client.v1.uploadMedia(profile, { type: 'png' })
          ]);
        } else {
          mediaIds = await Promise.all([
            // upload gif
            client.v1.uploadMedia(media, { type: mediaType }),
          ]);
        }

        console.log("finished image upload")

        console.log(mediaIds);
        const statusResponse = await client.v1.tweet(status, { media_ids: mediaIds.join(',') });
        console.log(statusResponse);
        section.properties.has_tweeted = true;
        fs.writeFileSync(geojsonFilePath, JSON.stringify(section));
      } catch (error) {
        console.log('Error posting status');
        console.error(error);
      }

      break;
    }
  }
}

go();
