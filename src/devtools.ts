// This script runs in the "devtools" page context (invisible)
// It creates the actual "panel" which the user sees.

// @ts-ignore
chrome.devtools.panels.create(
  "GraphQeLves",
  "", // Icon path (optional)
  "index.html", // The HTML file to load into the panel
  (_panel: any) => {
    // Code to run when the panel is created
    console.log("GraphQeLves panel created successfully");
  }
);