export const mapItemType = (frontendType) => {
    const typeMapping = {
        ticket: "ticket",
        service: "service",
        building: "building",
        property: "rent_property",
        rent_property: "rent_property",
    };
    return typeMapping[frontendType] || "ticket";
};
