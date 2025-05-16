/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook that runs before a new 'users' record is created.
 * Sets default values for subscription, role, referral code, and points.
 */
onRecordBeforeCreateRequest((e) => {
    const record = e.record;

    // 1. Set default subscription tier to 'free'
    record.set("subscription_tier", "free");

    // 2. Set expiry for free tier (e.g., 100 years from now)
    const farFutureDate = new Date();
    farFutureDate.setFullYear(farFutureDate.getFullYear() + 100);
    record.set("subscription_expiry_date", farFutureDate.toISOString());

    // 3. Set role based on class_status
    const classStatus = record.get("class_status");
    if (classStatus === "Teacher") {
        record.set("role", "teacher");
    } else {
        // Default for "11th", "12th", "Dropper"
        record.set("role", "user");
    }

    // 4. Generate unique user_referral_code
    let isCodeUnique = false;
    let referralCode = "";
    while (!isCodeUnique) {
        // Generate a 6-8 character alphanumeric code
        referralCode = `NEXUS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        try {
            // Check if a user with this referral code already exists
            const existingUser = $app.dao().findFirstRecordByData("users", "user_referral_code", referralCode);
            // If findFirstRecordByData doesn't throw, it means a user was found, so the code is not unique.
            // Loop again to generate a new code.
        } catch (err) {
            // If it's a 404 error, it means no user was found with this code, so it's unique.
            if (err.status === 404) {
                isCodeUnique = true;
            } else {
                // For any other errors (database issues, etc.), re-throw to halt the process.
                throw err;
            }
        }
    }
    record.set("user_referral_code", referralCode);

    // 5. Initialize referral_stats (if not already set by client - defensive)
    const referralStats = record.get("referral_stats");
    if (!referralStats || typeof referralStats !== 'object' || Object.keys(referralStats).length === 0) {
        record.set("referral_stats", {
            referred_free: 0,
            referred_chapterwise: 0,
            referred_full_length: 0,
            referred_dpp: 0,
            referred_combo: 0
        });
    }

    // 6. Initialize total_points (if not already set by client - defensive)
    if (record.get("total_points") === undefined || record.get("total_points") === null) {
        record.set("total_points", 0);
    }

    // You can add other initializations here if needed

}, "users"); // Specifies this hook is for the 'users' collection

// You can add other hooks for the 'users' collection in this file, e.g.:
// onRecordAfterUpdateRequest((e) => { ... }, "users");
// onRecordBeforeDeleteRequest((e) => { ... }, "users");