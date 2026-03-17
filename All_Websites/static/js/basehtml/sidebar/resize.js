import { sidebarHandle, sidebar } from "../../globalVars.js"; //from grandparent folder
let beingDragged = false;
let startingMouseX = 0;
let startingWidth = 0;
let activePointerId = null;
// Change beingDragged to true if sidebar handle is being dragged
if (sidebarHandle && sidebar) {
    sidebarHandle.addEventListener("pointerdown", (clickLocation) => {
        //If clicking on sidebar handle ...
        beingDragged = true;
        activePointerId = clickLocation.pointerId;
        sidebar.style.transition = "none";
        sidebar.classList.add("open"); // If user drags the bar, sidebar should be considered open
        startingMouseX = clickLocation.clientX; // X pos of pointer
        startingWidth = sidebar.offsetWidth; // Just get current width of sidebar
        console.log("Sidebar Handle is now being dragged"); // Log it!
    });
}
// Change beingDragged to false if sidebar handle is NOT being dragged
document.addEventListener("pointerup", (clickLocation) => {
    if (!sidebar) {
        return; // Don't do anything if sidebar is missing
    }
    // If you are stopping clicking...
    if (!beingDragged) {
        return; // Don't do anything if nothing is being dragged
    }
    // If this pointer is not the active one ...
    if (activePointerId !== null && clickLocation.pointerId !== activePointerId) {
        return; // Ignore unrelated pointerup events
    }
    beingDragged = false;
    activePointerId = null;
    sidebar.style.transition = "width .5s ease";
    console.log("Sidebar Handle is no longer being dragged"); // Log it!
});
// Actually move the sidebar
document.addEventListener("pointermove", (clickLocation) => {
    if (!sidebar) {
        return; // Don't do anything if sidebar is missing
    }
    if (!beingDragged) {
        // If the sidebar handle is NOT being dragged ...
        return; // Don't do anything if the bar is not being dragged
    }
    // If this pointer is not the active one ...
    if (activePointerId !== null && clickLocation.pointerId !== activePointerId) {
        return; // Ignore unrelated pointermove events
    }
    sidebar.style.transition = "none";
    let mouseChange = clickLocation.clientX - startingMouseX;
    let newWidth = mouseChange + startingWidth;
    const maxWidth = window.innerWidth * 0.6; // Percent of screen the sidebar can take up maximum (80%)
    const minWidth = window.innerWidth * 0.05; // Percent of screen the sidebar can take up minimum while open (5%)
    if (minWidth > newWidth) {
        // If the changed width is less than the minimum width ...
        newWidth = minWidth; // Go to min width
    }
    else if (newWidth > maxWidth) {
        // If the changed width is more than the maximum width ...
        newWidth = maxWidth; // Go to max width
    }
    sidebar.style.width = newWidth + "px"; // Finalize width
});
//# sourceMappingURL=resize.js.map