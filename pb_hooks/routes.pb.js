/// <reference path="../pb_data/types.d.ts" />

/**
 * Custom API route to check for and process expired user subscriptions.
 * Expected to be called by a scheduled task (cron job).
 *
 * Endpoint: POST /custom/check-expiries
 * Requires a 'X-Cron-Secret' header matching the CRON_SECRET_TOKEN environment variable.
 */
routerAdd("POST", "/custom/check-expiries", (c) => {
    // --- Security: Authenticate the cron job request ---
    const requestToken = c.request().header.get("X-Cron-Secret");
    const expectedToken = $os.getenv("CRON_SECRET_TOKEN"); // Store this secret in PocketBase Settings -> "Environment variables"

    if (!expectedToken) {
        console.error("CRON_SECRET_TOKEN is not set in PocketBase environment variables.");
        return c.json(500, { error: "Server configuration error." });
    }
    if (requestToken !== expectedToken) {
        console.warn("Unauthorized attempt to access /custom/check-expiries");
        return c.json(401, { error: "Unauthorized." });
    }

    const now = new Date();
    const nowISO = now.toISOString();
    const dao = $app.dao();
    let processedCount = 0;
    let usersDowngradedInfo = [];

    console.log(`[${nowISO}] Starting subscription expiry check...`);

    try {
        // Find users whose paid subscriptions have expired
        const expiredPaidUsers = dao.findRecordsByFilter(
            "users",
            `subscription_tier != 'free' && subscription_expiry_date < '${nowISO}'`,
            "-created", // Sort order (optional)
            0,          // Limit (0 for all - be cautious with very large user bases, consider batching)
            0           // Offset
        );

        for (const user of expiredPaidUsers) {
            const oldTier = user.get("subscription_tier");
            const oldExpiry = user.get("subscription_expiry_date");

            // 1. Downgrade user to 'free' tier
            user.set("subscription_tier", "free");
            const newFreeTierExpiry = new Date();
            newFreeTierExpiry.setFullYear(newFreeTierExpiry.getFullYear() + 100);
            user.set("subscription_expiry_date", newFreeTierExpiry.toISOString());
            
            dao.saveRecord(user); // Save changes to the user record

            // 2. Create a history record in the 'subscriptions' collection for the expiration event
            // This logs that the user's *previous* paid tier has now expired.
            const historyRecord = new Record(dao.findCollectionByNameOrId("subscriptions"), {
                "user": user.id,
                "tier": oldTier, // Log the tier that just expired
                "start_date": user.get("updated"), // Or a more specific 'last_subscription_start_date' if you track it
                "end_date": nowISO, // The moment it expired and was processed
                "status": "expired",
                "notes": `Automatically downgraded from ${oldTier} to free tier after expiry on ${oldExpiry}. Processed on ${nowISO}.`
            });
            dao.saveRecord(historyRecord);

            processedCount++;
            usersDowngradedInfo.push({ userId: user.id, oldTier: oldTier, newTier: "free" });
            console.log(`User ${user.id} (was ${oldTier}) downgraded to free. Expiry: ${oldExpiry}.`);

            // Optionally: Send an email notification to the user about the downgrade
            // sendEmailToUser(user.email, "Your subscription has expired", "...");
        }

        console.log(`Subscription expiry check completed. Processed ${processedCount} users.`);
        return c.json(200, {
            message: "Subscription expiry check completed successfully.",
            processed_count: processedCount,
            downgraded_users: usersDowngradedInfo
        });

    } catch (err) {
        console.error("Error during subscription expiry check:", err.toString(), err.stack);
        return c.json(500, { error: "An error occurred during expiry check: " + err.message });
    }
});


// --- Optional: Near Expiry Notifications ---
// You could add another route or extend the above to find users expiring soon
// (e.g., in 7 days) and send them email notifications.
// Example:
// routerAdd("POST", "/custom/notify-near-expiry", (c) => { ... });