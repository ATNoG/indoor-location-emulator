# Static Objects

Static Files used in Simulation

That repository includes the static files used on simulator and on backend:
1. antenna_datasets folder with: 
    - Experimental data collected of antenna RF and tags

2. config_files folder with:
    - configuration files for each map

3. geojson_objs folder with:
    - Geojson Maps 
    - Geojson of asset points positions
    - Geojson of antennas positions
    - Geojson of pulsing dots positions
    - Geojson of custom move animations

4. icons folder with:
    - icons/images used in emulator

---

## CI/CD Pipeline

### Stages for deployment
- deploy-prod

deploy-prod:
- This stage must print a message "This job deploys something from the $CI_COMMIT_BRANCH branch.", change directory and pull the code to selected directory, perform a reload on nginx, and restart backend-emulator docker image container: \
    - echo "This job deploys something from the $CI_COMMIT_BRANCH branch." \
    - ssh atnog@10.0.12.91 "cd ~/git/indoor-location-emulator-static-files; git pull; sudo systemctl reload nginx; sudo docker restart \ indoor-location-emulator-backend;"

---