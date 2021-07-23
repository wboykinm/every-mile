"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const tilebelt_1 = __importDefault(require("@mapbox/tilebelt"));
const get_pixels_1 = __importDefault(require("get-pixels"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const getImageFilePath = (z, x, y) => {
    const fileName = `${z}_${x}_${y}.pngraw`;
    // `${__dirname}/../../geom/${fileName}`;
    return `tmp/elevation_images/${fileName}`;
};
const getImageTile = async (z, x, y) => {
    const urlFileName = `${z}/${x}/${y}.pngraw`;
    // const fileName = `${z}_${x}_${y}.pngraw`;
    // const filePath = `tmp/elevation_images/${fileName}`;
    const filePath = getImageFilePath(z, x, y);
    if (fs_1.default.existsSync(filePath)) {
        console.log('Cache hit');
        const file = fs_1.default.readFileSync(filePath);
        return;
    }
    console.log('Cache miss');
    const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${urlFileName}?access_token=pk.eyJ1IjoiamNzYW5mb3JkIiwiYSI6ImNrcmYyejJwMzA1ZW0yb29kcGd2aXYzNm8ifQ.Xb6PPg3uG0WCgVffY1xTlg`;
    // console.log(url);
    const response = await node_fetch_1.default(url);
    const buffer = await response.buffer();
    console.log(filePath);
    fs_1.default.writeFileSync(filePath, buffer);
    // return new Uint8Array(buffer);
    // return new Uint8Array(response.buffer)
};
class ElevationFinder {
    async getElevation(latitude, longitude) {
        return new Promise(async (resolve, reject) => {
            const tileFraction = tilebelt_1.default.pointToTileFraction(longitude, latitude, 15);
            const tile = tileFraction.map(Math.floor);
            const [x, y, z] = tile;
            // const fileName = `${tile[2]}/${tile[0]}/${tile[1]}.pngraw`;
            await getImageTile(z, x, y);
            get_pixels_1.default(getImageFilePath(z, x, y), 'image/png', function (err, pixels) {
                if (err) {
                    reject(err);
                }
                const xp = tileFraction[0] - tile[0];
                const yp = tileFraction[1] - tile[1];
                const x = Math.floor(xp * pixels.shape[0]);
                const y = Math.floor(yp * pixels.shape[1]);
                const red = pixels.get(x, y, 0);
                const green = pixels.get(x, y, 1);
                const blue = pixels.get(x, y, 2);
                const height = -10000 + ((red * 256 * 256 + green * 256 + blue) * 0.1);
                resolve(height);
            });
        });
    }
}
exports.default = ElevationFinder;
