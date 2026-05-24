// PWA Registration Script
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, refresh the page
                if (confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Handle online/offline status display globally if an element exists
window.addEventListener('online', () => {
  console.log('App is online');
  const onlineIndicator = document.getElementById('online-indicator');
  if (onlineIndicator) {
    onlineIndicator.textContent = 'Online';
    onlineIndicator.className = 'text-green-500';
  }
});

window.addEventListener('offline', () => {
  console.log('App is offline');
  const onlineIndicator = document.getElementById('online-indicator');
  if (onlineIndicator) {
    onlineIndicator.textContent = 'Offline';
    onlineIndicator.className = 'text-red-500';
  }
});
