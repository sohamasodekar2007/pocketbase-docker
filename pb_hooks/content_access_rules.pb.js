/// <reference path="../pb_data/types.d.ts" />
onRecordBeforeCreateRequest((e) => {
    const record = e.record;
    const tier = record.get("tier");
    if (!tier) {
        throw new BadRequestError("Tier is required for content access rule.");
    }
    // Could add validation for 'accessible_content_types' JSON structure here
}, "content_access_rules");

onRecordBeforeUpdateRequest((e) => {
    const record = e.record;
    // Similar validation for updates
}, "content_access_rules");