// Minimal stub for @dulce/gcp
export async function ensureTopic() {
    // Stub: do nothing
}
export function getPubSub() {
    // Stub: return a mock object
    return {
        topic: (name) => ({
            publishMessage: async (msg) => 'mock-id',
        }),
    };
}
//# sourceMappingURL=index.js.map