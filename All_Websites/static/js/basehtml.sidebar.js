const page = document.getElementById('main')
const sidebar = document.getElementById('sidebar')
const sidebarOpenButton = document.getElementById('open-sidebar')
const sidebarCloseButton = document.getElementById('close-sidebar')

//Close Sidebar when button clicked
sidebarCloseButton.addEventListener('click', () => { // If you click on the close sidebar button
    sidebar.classList.remove('open'); // Remove open class, meaning the sidebar goes away
    sidebarOpenButton.classList.remove('hidden'); // makes button to open sidebar appear
    console.log('Sidebar closed by clicking close button'); // Logs the action
    //page.classList.toggle('TEST')
});



//Close sidebar on click-out on mobile only
function mobileClickOutside (clickLocation) {
    if (window.innerWidth <= 550) {  // Checks if screen is roughly phone sized (iPhone 17 Pro Max ~ 450, Samsung Galaxy S25 Ultra ~ 412) in px, extra for bigger phone screens
        if (sidebar.classList.contains('open') && !clickLocation.target.closest('#sidebar')) {  // If sidebar is open AND click location is outside of the sidebar
            if (clickLocation.target !== sidebarOpenButton) {  // In case you hold click or other potentional errors
                sidebar.classList.remove('open'); // Remove open class, meaning the sidebar goes away
                sidebarOpenButton.classList.remove('hidden'); // makes button to open sidebar appear
                console.log('Sidebar closed by clicking outside'); // Logs the action
            };
        };
    };
};
// because phone dumb and delays touch/clicks
document.addEventListener('click', mobileClickOutside) 
document.addEventListener('touchstart', mobileClickOutside)


//Open sidebar when button clicked
sidebarOpenButton.addEventListener('click', () => {
    sidebar.classList.add('open'); // Opens sidepanel
    sidebarOpenButton.classList.add('hidden'); // makes button to open sidebar disappear
    console.log('Sidebar opened by clicking open button'); // Logs the action
    //page.classList.toggle('TEST')
});

//Checks if button is hovered over and adds outline
document.addEventListener('mouseover', (event) => {
    const button = event.target.closest('.hover-over-buttons');
    if (button) {  // If the button supports an outline,
        button.classList.add('moused-over'); // Add outline class
        console.log(`${event.target} has been hovered over!`) // Log it!
    }
});

//Checks if button is hovered over and removes outline
document.addEventListener('mouseout', (event) => {
    const button = event.target.closest('.hover-over-buttons');
    if (button) {  // If the button supports an outline,
        button.classList.remove('moused-over'); // Remove outline class
        console.log(`${event.target} has been un-hovered over!`) // Log it!
    }
});