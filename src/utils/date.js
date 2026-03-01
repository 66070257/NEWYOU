export const formatDate = (value) => {
    if (!value) return "-";

    if (typeof value === "string") return value;

    if (value?.toDate) {
        return value.toDate().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "2-digit"
        });
    }

    return "-";
};

export const getCreatedAtMillis = (value) => {
    if (!value) return 0;

    if (typeof value === "string") {
        const parsedValue = Date.parse(value);
        return Number.isNaN(parsedValue) ? 0 : parsedValue;
    }

    if (value?.toDate) {
        return value.toDate().getTime();
    }

    return 0;
};

export const filterByDateRange = (items, range, nowTime) => {
    if (range === "alltime") return items;

    const millisecondsByRange = {
        day: 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000
    };

    const rangeMilliseconds = millisecondsByRange[range];
    if (!rangeMilliseconds) return items;

    const thresholdTime = nowTime - rangeMilliseconds;

    return items.filter((item) => getCreatedAtMillis(item.createdAt) >= thresholdTime);
};
