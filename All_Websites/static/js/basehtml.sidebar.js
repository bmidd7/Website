const sidebar = document.getElementById('sidebar')
const sidebarCloseButton = document.getElementById('close-sidebar')
const sidebarOpenButton = document.getElementById('open-sidebar')
const page = document.getElementById('main')

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
    page.classList.toggle('TEST')
});