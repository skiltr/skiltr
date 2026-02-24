// filter.types.js
export function equalsFilter(field, value) {
    return {
        type: 'equals',
        field,
        value,
        apply(items) {
            return items.filter(i => i[field] === value);
        }
    };
}

export function rangeFilter(field, min, max) {
    return {
        type: 'range',
        field,
        min,
        max,
        apply(items) {
            return items.filter(i =>
                i[field] >= min && i[field] <= max
            );
        }
    };
}
