# Make a profile chart image
# USAGE:
# bash 06_profile.sh

# Loop through the geojson files
for m in $(ls ../../geom/lt/mile_*.geojson); do
  base=$(basename ${m%.geojson})
  # prep data
  cp ../../geom/lt/${base}.geojson mile_current.geojson
  # run server
  static-server -p 8001 &
  # get image
  node profile.js "../../images/profile/profile_${base}.png"
  # clean up
  kill $(ps aux | grep '[s]tatic-server -p 8001' | awk '{print $2}')
done
