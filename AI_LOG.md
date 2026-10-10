# CorridorG / WildTrace Development Log

**Date:** 10 October 2026

## 1. Added GPS Tracking Dataset and Dependencies

**Work completed:**
- Added the GPS tracking dataset containing jaguar movement observations.
- Manually added/installed the React and Leaflet dependencies.

**AI involvement:** No AI prompt was provided for this step. The dependencies were added manually.

---

## 2. Initial Map Implementation

**Exact AI prompt used:**

> In `app/src/App.tsx`, create a minimal Leaflet map centred on the Humid Chaco region of Paraguay. Use React Leaflet and OpenStreetMap tiles. Ensure the map has a height of 500px and loads Leaflet CSS. Do not load the CSV yet. Do not modify any other files. Verify the app builds successfully.

**Changes made:**
- Added the initial Leaflet map.
- Centred the map on the Humid Chaco region of Paraguay.
- Used React Leaflet and OpenStreetMap tiles.
- Set the map height to 500px.
- Loaded Leaflet CSS.
- Kept CSV loading out of this initial implementation, as instructed in the prompt.

**AI involvement:** AI-assisted implementation of the initial map in `app/src/App.tsx`.

---

## 3. CSV Loading and Valid GPS Observation Counting

**Exact AI prompt used:**

> Load the CSV from `app/public/data/jaguar_movement_data.csv` using Papa Parse. Parse only rows with valid `lat` and `lng` values. Display the total number of valid observations in the UI. Do not render markers yet. Verify the count updates correctly.

**Changes made:**
- Added CSV loading from `app/public/data/jaguar_movement_data.csv`.
- Used Papa Parse to parse the CSV file.
- Filtered the data to include only rows with valid `lat` and `lng` values.
- Displayed the total number of valid GPS observations in the UI.
- Did not render markers during this stage, following the prompt.

**AI involvement:** AI-assisted implementation of CSV parsing, coordinate validation and observation counting.

---

## 4. GPS Observation Marker Rendering

**Exact AI prompt used:**

> Render a Leaflet CircleMarker for each valid observation. Use `lat` and `lng` as the marker position. Keep markers small (radius 3–5) and semi-transparent. Ensure markers render without errors. Verify the marker count matches the observation count.

**Changes made:**
- Added Leaflet CircleMarkers for valid GPS observations.
- Used `lat` and `lng` as the marker coordinates.
- Kept the markers small, with a radius of 3–5.
- Made the markers semi-transparent.
- Worked toward ensuring markers rendered without errors.
- Checked that the marker count matched the valid observation count.

**AI involvement:** AI-assisted implementation of GPS marker rendering.

---

## 5. GPS Marker Popups

**Exact AI prompt used:**

> Add a Leaflet Popup to each marker that displays the `Event_ID` when clicked. Ensure popups open correctly and show the expected value. Verify no duplicate or missing popups.

**Changes made:**
- Added a Leaflet Popup to each marker.
- Configured the popup to display the corresponding `Event_ID` when the marker is clicked.
- Included verification requirements for correct popup behaviour and duplicate or missing popups.

**AI involvement:** AI-assisted implementation of interactive GPS marker popups.

---

## 6. Marker Rendering Optimisation

**Exact AI prompt used:**

> Optimize performance by limiting the number of rendered markers. If the dataset exceeds 2500 observations, render only a representative subset (e.g., every Nth point) to avoid browser slowdown. Display the actual count in the UI. Verify the app remains responsive.

**Changes made:**
- Added marker-rendering optimisation to reduce browser slowdown.
- Introduced the idea of rendering a representative subset when the dataset exceeds 2,500 observations.
- Preserved the requirement to display the actual observation count in the UI.
- Manually fixed bugs encountered during development.
- Manually reduced the number of rendered markers to 2,500.

**Important distinction:** The AI prompt proposed representative-subset rendering. The manual reduction to 2,500 markers was a separate action performed during debugging and optimisation.

**AI involvement:** AI-assisted optimisation guidance, followed by manual bug fixing and marker-count adjustment.

---

## 7. Manual Sorting of Jaguar Observations

**Work completed manually:**
- Manually sorted the jaguar observations.
- Organised the observation data for use in the jaguar movement visualisation.

**AI involvement:** No specific AI prompt was provided for this step. The sorting was performed manually.

---

## 8. Jaguar Movement Visualisation

**Work completed:**
- Added jaguar movement visuals.
- Extended the map visualisation beyond individual GPS observation points to include visual representations of jaguar movement.

**AI involvement:** No separate prompt for this specific step was provided in the supplied development log. The precise implementation method and degree of AI assistance have not been established.

---

## 9. Vite Configuration and Editor Error Troubleshooting

**AI tool used:** Devin AI

**Exact prompt used:**

> The code compiles and dependencies are installed, but the editor UI is still showing red underlines for the react and tailwind imports in vite.config.ts. Please restart the language server or reload the editor window to clear the stale error flags.

**Issue addressed:**
- The code compiled successfully.
- Dependencies were installed.
- The editor continued to display red underlines under the React and Tailwind imports in `vite.config.ts`.

**Requested action:**
- Restart the language server or reload the editor window to clear stale error indicators.

**AI involvement:** Devin AI was asked to address the editor's stale error flags. The prompt requested an editor/language-server refresh, rather than a rewrite of the application code.

---

## 10. Environmental Map-Layer Toggle Controls

**Exact AI prompt used:**

> In the existing CorridorG React + TypeScript app, add a compact environmental map-layers control panel. Add toggles for GPS observation points, jaguar movement trails, roads, vegetation, and water. Wire the first two toggles to the existing map layers. For roads, vegetation, and water, create state and UI controls but don't attempt to load files yet. Keep the existing map and CSV parsing working. Make changes only to the relevant frontend files, and summarize the changes.

**Changes made:**
- Added toggle options to the map.
- Added a compact environmental map-layers control panel.
- Created five layer controls:
  1. GPS observation points
  2. Jaguar movement trails
  3. Roads
  4. Vegetation
  5. Water
- Wired the GPS observation-points toggle to the existing GPS observation layer.
- Wired the jaguar movement-trails toggle to the existing movement layer.
- Created state and UI controls for roads, vegetation and water.
- Did not implement file loading for roads, vegetation or water, as explicitly instructed.
- Preserved the existing map and CSV parsing functionality.
- Restricted the requested modifications to the relevant frontend files.

**AI involvement:** AI-assisted implementation of the toggle panel, its state and its connections to the existing GPS and movement layers.

**Current limitation:** Roads, vegetation and water have toggle controls but are not yet connected to loaded environmental datasets.

---

## 11. Consolidated AI Usage Record

The following prompts were explicitly supplied during development:

1. Initial Leaflet map implementation in `app/src/App.tsx`.
2. CSV loading using Papa Parse and valid GPS observation counting.
3. GPS CircleMarker rendering.
4. GPS marker popups displaying `Event_ID`.
5. Marker rendering optimisation for datasets exceeding 2,500 observations.
6. Environmental map-layer toggle panel for GPS points, movement trails, roads, vegetation and water.
7. A separate Devin AI prompt to resolve stale React and Tailwind import error indicators in `vite.config.ts`.

**Total documented prompts:** 7, comprising six application-development prompts and one Devin AI troubleshooting prompt.

## 12. Consolidated Manual Work Record

The following work was explicitly identified as manual:

- Added/installed the React and Leaflet dependencies manually.
- Fixed bugs encountered during development.
- Reduced the rendered marker count to 2,500.
- Sorted the jaguar observations manually.

Additional implementation and testing details should be recorded only when confirmed, rather than assumed.

## 13. AI Contribution and Code Attribution

**AI-assisted implementation:**
- Initial map setup.
- CSV parsing and coordinate filtering.
- Observation counting.
- GPS marker rendering.
- Popup implementation.
- Marker-rendering optimisation guidance.
- Environmental map-layer toggle controls.
- Devin AI troubleshooting request for stale editor error indicators.

**Manual contribution:**
- Dependency installation.
- Bug fixing.
- Marker-count reduction to 2,500.
- Jaguar observation sorting.

**AI-generated code percentage:** Not yet measured. The number of prompts alone cannot establish the proportion of code generated by AI. A reliable estimate requires reviewing the actual code changes and identifying which lines were generated, manually written, or substantially modified by the developer.

## 14. Current Development Milestone

The application has progressed from an initial Leaflet map to a GPS-based jaguar movement visualisation with:

- A map centred on the Humid Chaco region of Paraguay.
- OpenStreetMap tiles and Leaflet styling.
- CSV-based jaguar GPS observation loading.
- Validation of latitude and longitude coordinates.
- A valid-observation count in the UI.
- GPS CircleMarkers.
- Interactive `Event_ID` popups.
- Marker rendering limited to 2,500.
- Manually sorted jaguar observations.
- Jaguar movement visuals.
- A five-option environmental map-layer toggle panel.
- Working toggle connections for GPS observation points and jaguar movement trails.
- Placeholder state and UI controls for roads, vegetation and water.

**Next step:** Load and integrate the road-network, vegetation and water datasets, then connect them to their existing toggles. Continue improving geographic coverage and test the application with larger datasets.

15. Jaguar Movement Trails Completed

Completed the jaguar movement-trail visualisation.

Continued development of the map after implementing GPS observation markers and movement visuals.

Prepared to integrate additional environmental datasets to complement the existing wildlife movement data.

16. Environmental Data Integration Planning

Established the next development stage as acquiring environmental datasets before implementing further map overlays.

Prioritised road-network data first, followed by forest/vegetation and habitat-related data.

Planned to integrate the environmental datasets with the existing map-layer toggle controls.

Identified roads as the first environmental layer to acquire.

17. Road-Network Data Acquisition Using Overpass Turbo

Tool used: Overpass Turbo, querying OpenStreetMap data.

Initial study-region bounding box:

South: -24.5

West: -59.5

North: -22.0

East: -57.0

Work performed:

Worked on obtaining road-network data for the Humid Chaco region of Paraguay.

Used an Overpass Turbo query targeting a defined geographic bounding box.

Followed the workflow of running the query and exporting the resulting road data as GeoJSON.

Identified app/public/data/roads.geojson as the intended destination for the exported road dataset.

Status: The road-data acquisition workflow was initiated. Successful completion and saving of the GeoJSON file have not been independently confirmed in the available development history.

18. Geographic Coverage Expansion

Problem identified:

The initial road-data workflow covered only a small geographic region.

A larger study area was needed to support the wider jaguar movement visualisation.

Work performed:

Investigated expanding road-data coverage beyond the initial region.

Considered obtaining road data from several smaller geographic regions instead of relying on one large query.

Explored the approach of processing smaller geographic tiles to reduce query failures and server timeouts.

Encountered errors during attempts to expand the data-acquisition workflow.

Outcome:

Identified regional or tiled data acquisition as a possible approach for expanding coverage.

Further work is required to confirm successful downloads, combine the resulting datasets, and validate their geographic coverage.

19. Overpass Turbo Query and Server Troubleshooting

Work performed:

Attempted to run road-data queries for the selected geographic region.

Investigated errors encountered during data retrieval.

Worked through the limitations of requesting a larger geographic area in a single query.

Considered splitting the study region into smaller areas to make data retrieval more manageable.

Status: The road-data retrieval process still required further troubleshooting. A fully successful, expanded road-network export was not confirmed in the available record.

20. Git Repository and File-Tracking Check

Work performed:

Inspected the development environment and questioned why certain files appeared greyed out in the editor.

Investigated whether the appearance indicated that those files would be excluded from Git.

Raised the question of whether the files would be included in the repository.

Status: The exact Git tracking or ignore status of the files has not been established from the available record. This requires checking the repository's Git status and ignore rules before recording a definitive result.

21. AI Assistance Record for This Development Stage

AI-assisted guidance:

Guidance on querying OpenStreetMap road data through Overpass Turbo.

Guidance on exporting road data in GeoJSON format.

Planning the expansion from a small geographic extract to a wider study region.

Discussion of dividing large geographic queries into smaller tiles to reduce retrieval failures.

Manual work and interaction:

Worked through the road-data acquisition workflow.

Attempted to retrieve data for the selected study region.

Tested the data-retrieval process and encountered errors.

Inspected the development environment and investigated file visibility and Git inclusion.

Exact prompts: No new verbatim AI coding prompt was available for these data-acquisition steps. The work primarily involved tool usage, troubleshooting and implementation guidance. The exact Overpass query text and the final Git status remain to be verified.

22. Updated Project Status

Completed or previously implemented:

Leaflet map centred on the Humid Chaco region of Paraguay.

Jaguar GPS observation loading and visualisation.

GPS marker popups.

Updated UI to make it look sleeker and more polished for the the Final Build

Marker-count optimisation and manual bug fixes.

Jaguar movement visuals and trails.

Environmental map-layer toggle controls for GPS points, movement trails, roads, vegetation and water.
