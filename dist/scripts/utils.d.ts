declare const trails: readonly ["brp", "at"];
export declare type TrailString = (typeof trails)[number];
declare type Extension = 'geojson' | 'png' | 'gif';
declare const getFilePath: (trailString: TrailString, mile: number | 'all', extension: Extension) => string;
declare const metersToFeet: (meters: number) => number;
declare const getTrailArg: () => TrailString | null;
declare const getDistance: (trailString: TrailString) => number;
declare const getMapId: (trailString: TrailString) => string;
declare const getBufferDistance: (trailString: TrailString) => number;
declare const getTwitterClientConfig: (trailString: TrailString) => {
    appKey: string;
    appSecret: string;
    accessToken: string;
    accessSecret: string;
};
export { getFilePath, metersToFeet, getTrailArg, getDistance, getMapId, getBufferDistance, getTwitterClientConfig };
