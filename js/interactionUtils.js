function getTelemetryObjectType(el) {
    if (!el) return 'unknown';

    if (el.components?.orb || el.hasAttribute('orb')) {
        return 'orb';
    }

    if (el.components?.box || el.hasAttribute('box')) {
        return 'box';
    }

    return 'unknown';
}