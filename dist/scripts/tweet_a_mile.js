"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const twitter_api_v2_1 = __importDefault(require("twitter-api-v2"));
const dotenv_1 = require("dotenv");
const utils_1 = require("./utils");
dotenv_1.config();
async function go() {
    const trailArg = utils_1.getTrailArg();
    if (!trailArg) {
        return;
    }
    const DISTANCE = utils_1.getDistance(trailArg);
    const twitterClientConfig = utils_1.getTwitterClientConfig(trailArg);
    const client = new twitter_api_v2_1.default(twitterClientConfig);
    for (let mile = 1; mile <= DISTANCE; mile++) {
        console.log(`Processing mile ${mile}`);
        const geojsonFilePath = utils_1.getFilePath(trailArg, mile, 'geojson');
        const file = fs_1.default.readFileSync(geojsonFilePath);
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
            }
            else {
                statusParts.push(mileageText);
            }
            const elevGainFeetDisplay = parseInt(utils_1.metersToFeet(elevation_difference).toFixed(), 10).toLocaleString();
            const elevGainMetersDisplay = parseInt(elevation_difference.toFixed()).toLocaleString();
            statusParts.push(`Elevation gain: ${elevGainFeetDisplay} ft (${elevGainMetersDisplay} m)`);
            const maxElevFeetDisplay = parseInt(utils_1.metersToFeet(max_elevation).toFixed(0)).toLocaleString();
            const maxElevMetersDisplay = parseInt(max_elevation.toFixed(0)).toLocaleString();
            statusParts.push(`Max elevation: ${maxElevFeetDisplay} ft (${maxElevMetersDisplay} m)`);
            const status = statusParts.join('\n');
            console.log(status);
            let mediaFilePath = utils_1.getFilePath(trailArg, mile, 'png');
            // getProFilePath - get it? i'm so sorry about this.
            let profileFilePath = utils_1.getProFilePath(trailArg, mile, 'png');
            let media = fs_1.default.readFileSync(mediaFilePath);
            let profile = fs_1.default.readFileSync(profileFilePath);
            let mediaType = 'png';
            try {
                mediaFilePath = utils_1.getFilePath(trailArg, mile, 'gif');
                media = fs_1.default.readFileSync(mediaFilePath);
                mediaType = 'gif';
            }
            catch (error) {
                console.log('No gif found');
            }
            try {
                console.log("starting image upload");
                const mediaIds = await Promise.all([
                    // upload map
                    client.v1.uploadMedia(media, { type: mediaType }),
                    // upload profile chart
                    client.v1.uploadMedia(profile, { type: 'png' })
                ]);
                console.log("finished image upload");
                console.log(mediaIds);
                const statusResponse = await client.v1.tweet(status, { media_ids: mediaIds.join(',') });
                console.log(statusResponse);
                section.properties.has_tweeted = true;
                fs_1.default.writeFileSync(geojsonFilePath, JSON.stringify(section));
            }
            catch (error) {
                console.log('Error posting status');
                console.error(error);
            }
            break;
        }
    }
}
go();
