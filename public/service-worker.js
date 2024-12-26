self.addEventListener("push", function (event) {
  const options = {
    body: event.data.text(),
    icon: "/icon.png",
    badge: "/badge.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
    actions: [
      {
        action: "explore",
        title: "View Queue",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Queue Update", options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "explore") {
    // Open the app when the user clicks the notification
    event.waitUntil(clients.openWindow("/"));
  }
});
