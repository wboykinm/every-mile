# Make a profile chart image
# USAGE:
# bash 06_generate_profiles.sh <trail abbreviation>

# Loop through the geojson files
TRAILSTRING=$1

for m in $(ls ../../geom/${TRAILSTRING}/mile_*.geojson); do
  base=$(basename ${m%.geojson})
  # prep data
  cp ../../geom/${TRAILSTRING}/${base}.geojson mile_current.geojson
  # run server
  static-server -p 8001 &
  # get image
  node profile.js "../../images/${TRAILSTRING}/profile_${base}.png"
  # clean up
  kill $(ps aux | grep '[s]tatic-server -p 8001' | awk '{print $2}')
done
