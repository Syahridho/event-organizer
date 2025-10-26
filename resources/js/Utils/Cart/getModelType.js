export const getModelType = (category) => {
    const modelMap = {
        ticket: "App\\Models\\Ticket",
        booth: "App\\Models\\Booth",
        merchandise: "App\\Models\\Merchandise",
        workshop: "App\\Models\\Workshop",
        service: "App\\Models\\Service",
        building: "App\\Models\\Building",
        property: "App\\Models\\RentProperty",
    };

    return modelMap[category] || null;
};
