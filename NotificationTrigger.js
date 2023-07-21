const Redis = require('redis');
const NotificationSystem = require("./NotificationSystem");

class NotificationTrigger {
    constructor(notificationSystem, redisClient) {
        this.notificationSystem = notificationSystem;
        this.redisClient = redisClient;
    }

    async triggerNotification(eventData) {
        try {
            // Extract necessary information from the eventData
            const { eventType, userId, kycDocumentId
                , updateDetails } = eventData;

            // Create the notification object based on the event
            const notification = {
                eventType,
                userId,
                kycDocumentId,
                updateDetails,
                timestamp: Date.now()
            };

            // Store the notification in Redis queue and details in Redis hash
            await this.notificationSystem.pushNotificationToQueue(notification);
            await this.notificationSystem.storeNotificationDetails(notification.eventId, notification);

            // Notify subscribers in real-time (using Redis Pub/Sub)
            const serializedNotification = JSON.stringify(notification);
            await this.redisClient.publish("notification:channel", serializedNotification);

            // Return the created notification
            return notification;
        } catch (error) {
            // Handle errors or log them as needed
            console.error("Error triggering notification:", error);
            throw error;
        }
    }
}

// Example usage of the NotificationTrigger class with dependency injection
async function example(message) {

    const redisClient = Redis.createClient();
    try {
        redisClient.connect();
        const notificationSystem = new NotificationSystem(redisClient);
        const notificationTrigger = new NotificationTrigger(notificationSystem, redisClient);

        // Example KYC update event
        const kycUpdateEventData = {
            eventType: "KYC_UPDATE",
            userId: "user123",
            kycDocumentId: "kyc123",
            updateDetails: message
        };

        // Trigger the notification for the KYC update event using the NotificationTrigger class
        const notification = await notificationTrigger.triggerNotification(kycUpdateEventData);
        console.log("Notification triggered:", notification);

    } catch (error) {
        console.error("Error triggering notification:", error);
    } finally {
        await redisClient.quit();
    }
}

(async (args) => {
    try {
        const message = args[0] || 'Updated personal information.';
        console.log('Running...');
        await example(message);
        console.log('Done!');
    } catch (error) {
        console.error('An error occurred:', error);
    }
})(process.argv.slice(2));