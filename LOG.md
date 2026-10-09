added gps tracking dataset
added react and leaflet dependencies manually

"In `app/src/App.tsx`, create a minimal Leaflet map centred on the Humid Chaco region of Paraguay. Use React Leaflet and OpenStreetMap tiles. Ensure the map has a height of 500px and loads Leaflet CSS. Do not load the CSV yet. Do not modify any other files. Verify the app builds successfully.  "
-inital map was added

"Load the CSV from `app/public/data/jaguar_movement_data.csv` using Papa Parse. Parse only rows with valid `lat` and `lng` values. Display the total number of valid observations in the UI. Do not render markers yet. Verify the count updates correctly.  "
- csv loading was added

"Render a Leaflet CircleMarker for each valid observation. Use `lat` and `lng` as the marker position. Keep markers small (radius 3–5) and semi-transparent. Ensure markers render without errors. Verify the marker count matches the observation count.  "
- markers were added

"Add a Leaflet Popup to each marker that displays the `Event_ID` when clicked. Ensure popups open correctly and show the expected value. Verify no duplicate or missing popups.  "
- popups were added

"Optimize performance by limiting the number of rendered markers. If the dataset exceeds 2500 observations, render only a representative subset (e.g., every Nth point) to avoid browser slowdown. Display the actual count in the UI. Verify the app remains responsive.  "
- optimization was added

manually bugs were fixed and no of markers reduced to 2500

