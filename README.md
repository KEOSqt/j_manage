# j_manage

`j_manage` is a lightweight, browser-based worker management application for small teams that need a simple way to track labor information without setting up a backend service.

## Overview

The app provides a single-page dashboard to manage worker records, monitor quick KPIs, and move data in and out of CSV files.  
All data is stored locally in the browser using `localStorage`, so the project can be run as static files.

## Main Features

- **Worker CRUD**: add, edit, and delete worker records from a modal form.
- **Dashboard KPIs**:
  - Total workers
  - Active workers
  - Workers on leave
  - Total daily active labor cost
- **Search and filters**:
  - Search by name, phone, national ID, or address
  - Filter by job type
  - Filter by status (Active / On Leave / Inactive)
- **Sorting and pagination**:
  - Clickable table headers for sorting
  - Configurable rows per page (10/25/50/100)
- **CSV tools**:
  - Export current data to CSV
  - Import CSV (with replace confirmation)
- **Print support**: print the current view directly from the app.

## Data Model

Each worker entry includes:

- `id`
- `name`
- `phone`
- `jobType`
- `dailyWage`
- `nationalId`
- `status`
- `address`
- `notes`

## Project Structure

- `index.html` – page layout and UI elements
- `style.css` – styling, responsive behavior, and visual theme
- `script.js` – state management, rendering, filtering, sorting, pagination, CSV import/export, and localStorage integration

## How to Run

No build step is required.

1. Open `index.html` in a modern browser.
2. Start adding or importing workers.
3. Data is persisted locally in the browser under the key `wm_workers_v1`.

## Notes and Limitations

- This app uses **client-side storage only** (no server/database).
- Data is tied to the current browser/profile/device.
- Clearing browser storage will remove saved worker data.
- CSV import expects the same column structure used by the app export.
