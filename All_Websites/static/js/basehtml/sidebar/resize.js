import { sidebarHandle, sidebar } from "./globalVars.js";

let beingDragged = false;
let startingMouseX = 0;
let startingWidth = 0;

// Change beingDragged to true if sidebar handle is being dragged
sidebarHandle.addEventListener("pointerdown", (clickLocation) => {
    //If clicking on sidebar handle ...
    beingDragged = true;

    sidebar.style.transition = "none";

    startingMouseX = clickLocation.clientX; // X pos of pointer
    startingWidth = sidebar.offsetWidth; // Just get current width of sidebar

    console.log("Sidebar Handle is now being dragged"); // Log it!
});

// Change beingDragged to false if sidebar handle is NOT being dragged
document.addEventListener("pointerup", (clickLocation) => {
  // If you are stopping clicking...
  beingDragged = false;

  sidebar.style.transition = "width .5s ease";

  console.log("Sidebar Handle is no longer being dragged"); // Log it!
});

// Actually move the sidebar
document.addEventListener("pointermove", (clickLocation) => {
  if (!beingDragged) {
    // If the sidebar handle is NOT being dragged ...
    return; // Don't do anything if the bar is not being dragged
  }

  sidebar.style.transition = "none";

  let mouseChange = clickLocation.clientX - startingMouseX;

  let newWidth = mouseChange + startingWidth;

  const maxWidth = window.innerWidth * 0.8; // Percent of screen the sidebar can take up maximum (80%)
  const minWidth = window.innerWidth * 0.1; // Percent of screen the sidebar can take up minimum (10%)

  if (minWidth > newWidth) {
    // If the changed width is less than the minimum width ...
    newWidth = minWidth; // Go to min width
  } else if (newWidth > maxWidth) {
    // If the changed width is more than the maximum width ...
    newWidth = maxWidth; // Go to max width
  }

  sidebar.style.width = newWidth + "px"; // Finalize width
});
