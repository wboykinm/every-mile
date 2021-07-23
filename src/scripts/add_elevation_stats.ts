import fs from 'fs';

import { DISTANCE_MILES } from '../constants';
import { getFilePath } from './utils';

let mostGain = 0;
let mostGainMile = 1;
let leastGain = 999;
let leastGainMile = 1;

for (let mile = 1; mile <= DISTANCE_MILES; mile++) {
  console.log(`Processing mile ${mile}`);

  const filePath = getFilePath(mile);
  const file = fs.readFileSync(filePath);
  const section = JSON.parse(file.toString());
  const { elevations } = section.properties
  
  const firstElevation = elevations[0];
  const lastElevation = elevations[elevations.length - 1];
  const elevationDifference = lastElevation - firstElevation;
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  
  console.log(`${minElevation} -> ${maxElevation} [${firstElevation} : ${lastElevation}] ${elevationDifference}`);
  section.properties.min_elevation = minElevation;
  section.properties.max_elevation = maxElevation;
  section.properties.elevation_difference = elevationDifference;

  if (elevationDifference > mostGain) {
    mostGain = elevationDifference;
    mostGainMile = mile;
  }

  if (elevationDifference < leastGain) {
    leastGain = elevationDifference;
    leastGainMile = mile;
  }

  fs.writeFileSync(filePath, JSON.stringify(section));
}

console.log(`Most gain mile: ${mostGainMile} (${mostGain})`);
console.log(`Least gain mile: ${leastGainMile} (${leastGain})`);
