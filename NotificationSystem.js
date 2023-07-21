const redis = require('redis');

class NotificationSystem {
    constructor(redisClient) {
        this.redisClient = redisClient;
    }

    // User Subscriptions (Redis Sets)
    async subscribeUserToNotification(notificationType, userId) {
        try {
            await this.redisClient.sAdd(`notification:${notificationType}:subscribers`, userId);
        } catch (error) {
            // Handle errors or log them as needed
            console.error(`Error subscribing user ${userId} to notification ${notificationType}:`, error);
            throw error;
        }
    }

    async unsubscribeUserFromNotification(notificationType, userId) {
        try {
            await this.redisClient.sRem(`notification:${notificationType}:subscribers`, userId);
        } catch (error) {
            // Handle errors or log them as needed
            console.error(`Error unsubscribing user ${userId} from notification ${notificationType}:`, error);
            throw error;
        }
    }

    // Notification Queue (Redis List)
    async pushNotificationToQueue(notification) {
        try {
            const serializedNotification = JSON.stringify(notification);
            await this.redisClient.lPush("notification:queue", serializedNotification);
        } catch (error) {
            // Handle errors or log them as needed
            console.error("Error pushing notification to the queue:", error);
            throw error;
        }
    }

    async popNotificationFromQueue() {
        try {
            const serializedNotification = await this.redisClient.lPop("notification:queue", 0);
            return JSON.parse(serializedNotification);
        } catch (error) {
            // Handle errors or log them as needed
            console.error("Error popping notification from the queue:", error);
            throw error;
        }
    }

    // Notification Details (Redis Hashes)
    async storeNotificationDetails(notificationId, notificationDetails) {
        try {
            await this.redisClient.hSet(`notification:${notificationId}`, notificationDetails);
        } catch (error) {
            // Handle errors or log them as needed
            console.error(`Error storing notification details for notification ID ${notificationId}:`, error);
            throw error;
        }
    }

    async getNotificationDetails(notificationId) {
        try {
            return this.redisClient.hGetAll(`notification:${notificationId}`);
        } catch (error) {
            // Handle errors or log them as needed
            console.error(`Error getting notification details for notification ID ${notificationId}:`, error);
            throw error;
        }
    }
}

async function example() {
    const redisClient = redis.createClient();
    redisClient.connect();
    try {
        // Example usage of the NotificationSystem class
        const notificationSystem = new NotificationSystem(redisClient);

        // Subscribe user 123 to notification type "KYC_UPDATE"
        await notificationSystem.subscribeUserToNotification("KYC_UPDATE", "123");

        // Push a new notification to the queue
        const newNotification = {
            content: "A new KYC update has been submitted.",
            timestamp: Date.now(),
            sender: "User456",
        };
        await notificationSystem.pushNotificationToQueue(newNotification);

        // Pop a notification from the queue and get its details
        const notification = await notificationSystem.popNotificationFromQueue();
        console.log("Received notification:", notification);

        // Store notification details in Redis hash
        await notificationSystem.storeNotificationDetails("notification_id_123", {
            content: "A notification details example.",
            timestamp: Date.now(),
            sender: "User789",
        });

        // Get notification details from Redis hash
        const notificationDetails = await notificationSystem.getNotificationDetails("notification_id_123");
        console.log("Notification details:", notificationDetails);
    } catch (error) {
        // Handle any errors that occurred during the execution of the example
        console.error("Example error:", error);
    } finally {
        await redisClient.quit();
    }
}

(async function main(args) {
    try {
        console.log('Running...');

        await example();

        console.log('Done!');
    } catch (error) {
        console.error('An error occurred:', error);
    }
})(process.argv.slice(2));