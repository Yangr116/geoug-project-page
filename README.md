# GeoUG Project Page

Academic project website for **Learning and Reasoning with Geometry: How Generation Helps Spatial Understanding**.

- Code: https://github.com/hku-sail/GeoUG
- Paper: [PDF](assets/geoug-paper.pdf)

## Local preview

Run `python3 -m http.server 8000` in this directory and open http://localhost:8000.

## GitHub Pages

This is a standalone static website with relative asset links and no build dependencies.
To publish, choose **Settings → Pages → Deploy from a branch → main → / (root)**.

## Editing

- `index.html`: content, author list, tables, and media links.
- `style.css`: layout and typography.
- `script.js`: video labels, carousels, and animation controls.
- `assets/`: the manuscript and media used by the page.

Videos show recorded model outputs and visualizations, not live inference. The homepage two-view fusion is illustrative and uses estimated ego intrinsics; residual alignment errors remain. Task examples use the corresponding GeoUG configurations. Original photographs in the homepage and model overview use a mosaicked face.
