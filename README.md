# BioKIN Interactive Design Demonstrator

This package contains only the browser-based schematic mockup. It does not contain the research Python scripts, GDS files, authentication, analytics, or ChatGPT dependencies.

## Publish in damome/biokin

1. Extract this ZIP.
2. In https://github.com/damome/biokin choose Add file > Upload files. If the repository is empty, use the uploading an existing file link.
3. Drag the entire docs folder into the upload area, keeping its name and contents. Commit the files to the main branch. Do not replace any existing docs folder or publishing configuration without reviewing it first.
4. Open Settings > Pages.
5. Under Build and deployment, choose Deploy from a branch, select main and /docs, then Save.
6. Wait for GitHub to show the published site address. Open it in a private browser window to confirm that it needs no login, then use that exact URL for the QR code.

Only the repository owner needs to log in to configure the website. Visitors to a public Pages website do not need GitHub or ChatGPT accounts.

The free GitHub Pages route requires a public repository. If the repository contains unpublished research or confidential material, do not make it public just to activate Pages. Use a separate public repository containing only these demo files.

## Update

Replace docs/index.html, docs/styles.css, and docs/app.js with the revised demo files and commit. As long as the Pages address remains the same, the QR code does not need to change.

## Scientific limitation

This is an illustrative JavaScript/SVG demonstrator, not the PHIDL generator or a validated fabrication layout. Routes and layers are schematic; electrical isolation, mechanical behaviour, and fabrication constraints have not been validated by the website.
