chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'userJoined') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/logo16.png', // Path to your icon image
        title: 'Google Meet Notification',
        message: 'A user joined the call!'
      });
      console.log('User joined the call!');
      sendResponse({ status: 'Notification sent!' });
    }
  });
  