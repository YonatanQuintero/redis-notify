const Redis = require("redis");

class NotificationSubscriber {
    constructor(redisSubscriber) {
        this.redisSubscriber = redisSubscriber
    }

    startListening() {
        this.redisSubscriber.subscribe("notification:channel", (message) => this.handleNotification(message));
    }

    stopListening() {
        this.redisSubscriber.unsubscribe("notification:channel");
    }

    handleNotification(message) {
        try {
            // Parse the notification message (assuming it's in JSON format)
            const parsedNotification = JSON.parse(message);

            // Process the notification and display it in the admin interface or notification center
            console.log("Received notification:", parsedNotification);
            // You can update the UI to show the new notification to the admin user

            return parsedNotification;

        } catch (error) {
            // Handle parsing or processing errors
            console.error("Error handling notification:", error);
        }
    }
}

// Example usage of the NotificationSubscriber class
async function example() {

    const redisSubscriber = Redis.createClient();
    redisSubscriber.connect();
    try {
        const notificationSubscriber = new NotificationSubscriber(redisSubscriber);
        notificationSubscriber.startListening();
    } catch (error) {
        console.error("Error handling notification subscriber:", error);
    }
}

(async (args) => {
    try {
        console.log('Running...');
        await example();
        console.log('Done!');
    } catch (error) {
        console.error('An error occurred:', error);
    }
})(process.argv.slice(2));