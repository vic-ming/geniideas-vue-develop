export function matchRule(item, rules) {
    if (!Array.isArray(rules)) return null;

    for (const rule of rules) {
        if (!rule.match) continue;

        const isMatch = Object.entries(rule.match).every(([key, validValues]) => {
            const itemValue = item[key];
            // If the rule specifies this key must match something, but the item doesn't have it, it's a fail
            if (itemValue === undefined || itemValue === null) return false;

            const normalizedItemValue = String(itemValue).trim().toUpperCase();

            // validValues should be an array of acceptable strings
            if (Array.isArray(validValues)) {
                return validValues.some(v => String(v).trim().toUpperCase() === normalizedItemValue);
            }

            // Fallback if validValues is a string
            return String(validValues).trim().toUpperCase() === normalizedItemValue;
        });

        if (isMatch) {
            return rule.output || null;
        }
    }

    return null;
}
