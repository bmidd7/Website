import { mainPage, sidebar, sidebarOpenButton, sidebarCloseButton } from './globalVars.js'

const defaultSidebarWidth = "clamp(5vw, 10vw, 60vw)"; // Default open width still lets resize

// Open sidebar
function openSidebar() {
  // If sidebar is missing for some reason ...
  if (!sidebar) {
    return; // Don't do anything
  }

  sidebar.classList.add("open"); // Opens sidepanel
  sidebar.style.width = defaultSidebarWidth; // Always force opens sidebar to default width

  // If open button exists on this page ...
  if (sidebarOpenButton) {
    sidebarOpenButton.classList.add("hidden"); // makes button to open sidebar disappear
  }
}

// Close sidebar helper so all close actions do the same thing
function closeSidebar() {
  // If sidebar is missing for some reason ...
  if (!sidebar) {
    return; // Don't do anything
  }

  sidebar.classList.remove("open"); // Remove open class, meaning the sidebar goes away
  sidebar.style.width = "0px"; // Always force closes sidebar, no matter current pos

  // If open button exists on this page ...
  if (sidebarOpenButton) {
    sidebarOpenButton.classList.remove("hidden"); // makes button to open sidebar appear
  }
}

//Close Sidebar when button clicked
if (sidebarCloseButton) {
  sidebarCloseButton.addEventListener("click", () => {
    // If you click on the close sidebar button ...
    closeSidebar();
    console.log("Sidebar closed by clicking close button"); // Logs the action
    //mainPage.classList.toggle('TEST')
  });
}

//Close sidebar on click-out on mobile only
function mobileClickOutside(clickLocation) {
  // If sidebar is missing for some reason ...
  if (!sidebar) {
    return; // Don't do anything
  }

  if (window.innerWidth <= 550) {  // Checks if screen is roughly phone sized in px
    if (
      sidebar.classList.contains("open") &&
      !clickLocation.target.closest("#sidebar")
    ) {
      // If sidebar is open AND click location is outside of the sidebar
      if (clickLocation.target !== sidebarOpenButton) {  // In case you hold click or other potential errors
        closeSidebar();
        console.log("Sidebar closed by clicking outside"); // Logs the action
      }
    }
  }
}
// because phone dumb and delays touch/clicks
document.addEventListener("click", mobileClickOutside);
document.addEventListener("touchstart", mobileClickOutside);

//Open sidebar when button clicked
if (sidebarOpenButton) {
  sidebarOpenButton.addEventListener("click", () => {
    // If you click on the open sidebar button ...
    openSidebar();
    console.log("Sidebar opened by clicking open button"); // Logs it
    //mainPage.classList.toggle('TEST')
  });
}

//Checks if button is hovered over and adds outline
document.addEventListener("mouseover", (event) => {
  const button = event.target.closest(".hover-over-buttons");
  if (button) {  // If the button supports an outline,
    button.classList.add("moused-over"); // Add outline class
    console.log(`${event.target} has been hovered over!`); // Log it!
  }
});

//Checks if button is hovered over and removes outline
document.addEventListener("mouseout", (event) => {
  const button = event.target.closest(".hover-over-buttons");
  if (button) {  // If the button supports an outline,
    button.classList.remove("moused-over"); // Remove outline class
    console.log(`${event.target} has been un-hovered over!`); // Log it!
  }
});
