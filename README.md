# CPPN2WFCinJS

CPPN2WFCinJS is a JavaScript reimplementation of a CPPN-driven Wave Function Collapse project. It uses p5.js for rendering and a set of custom JS modules for the WFC, heuristics, tilesets, and CPPN/NEAT-based candidate generation.

## What’s Included

The repository currently ships with three browser entry points:

- `index.html` - main generation view for building WFC outputs from prepared bundles.
- `debug.html` - debug view for inspecting and selecting generated layouts before mutating.
- `map-elites.html` - Map-Elites view for exploring candidate coverage and exporting results.

## How To Run

This is a static front-end project. Open one of the HTML entry points through a local web server so the relative script paths resolve correctly.

Common options:

1. Use VS Code Live Server.
2. Or run a simple local server from the project folder, for example `python -m http.server`.

Then open:

- `index.html` for the main project.
- `debug.html` for the debug tools.
- `map-elites.html` for the Map-Elites archive.

## Main Controls

In the main and debug views you can:

- Choose a prepared bundle from the dropdown.
- Set the seed and grid size.
- Select the cell heuristic and tile heuristic.
- Press `Generate` to rebuild using the current settings.
- Press `Generate (Random Seed)` to rebuild with a random seed.
- Click generated images to select them.
- Press `Mutate` to evolve from the selected layouts.
