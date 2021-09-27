"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const async_1 = require("async");
const node_fetch_1 = __importDefault(require("node-fetch"));
const buffer_1 = __importDefault(require("@turf/buffer"));
const polygon_to_line_1 = require("@turf/polygon-to-line");
const polyline_1 = __importDefault(require("@mapbox/polyline"));
const utils_1 = require("./utils");
const constants_1 = require("../constants");
const before_layer = 'contour-label';
const padding = '120';
const dimensions = '850x500';
const params = { padding, before_layer, access_token: constants_1.MAPBOX_TOKEN };
const go = () => {
    const trailArg = utils_1.getTrailArg();
    if (!trailArg) {
        return;
    }
    const DISTANCE = utils_1.getDistance(trailArg);
    const mapId = utils_1.getMapId(trailArg);
    const tasks = [];
    for (let mile = 1; mile <= DISTANCE; mile++) {
        tasks.push((cb) => {
            setTimeout(async () => {
                //console.log(`Processing mile ${mile}`);
                const filePath = utils_1.getFilePath(trailArg, mile, 'geojson');
                const file = fs_1.default.readFileSync(filePath);
                const section = JSON.parse(file.toString());
                //const bufferedLineAsPolygon = turfBuffer(section.geometry, getBufferDistance(trailArg));
                // Some trails that snake back onto themselves and form a complex polygon
                // break here, so make the buffer smaller until it works. 0.045 generally does
                const bufferedLineAsPolygon = buffer_1.default(section.geometry, 0.025);
                const bufferedLineAsLine = polygon_to_line_1.polygonToLine(bufferedLineAsPolygon);
                //console.log(bufferedLineAsLine)
                const corrected = bufferedLineAsLine.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                //console.log(corrected)
                // eslint-disable-next-line
                // @ts-ignore
                const encodedLine = polyline_1.default.encode(corrected, 5);
                const path = `path-4+98709F-1+E4BCEB-0.4(${encodeURIComponent(encodedLine)})`;
                const url = `https://api.mapbox.com/styles/v1/${mapId}/static/${path}/auto/${dimensions}@2x?${(new URLSearchParams(params))}`;
                //console.log(url)
                const response = await node_fetch_1.default(url);
                const buffer = await response.buffer();
                fs_1.default.writeFileSync(utils_1.getFilePath(trailArg, mile, 'png'), buffer);
                cb(null, mile);
            }, 4000);
        });
    }
    async_1.series(tasks, (error, results) => {
        if (error) {
            console.log('errror', error);
            return;
        }
        console.log(results);
    });
};
go();
