/// <reference path="../pb_data/types.d.ts" />
onRecordBeforeCreateRequest((e) => {
    const record = e.record;
    // Basic validation: ensure start_date is not after end_date (if end_date is set)
    const startDate = new Date(record.get("start_date"));
    const endDate = record.get("end_date") ? new Date(record.get("end_date")) : null;

    if (endDate && startDate > endDate) {
        throw new BadRequestError("Start date cannot be after end date for a subscription.");
    }
    // Add more validation as needed
}, "subscriptions");