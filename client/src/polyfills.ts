// Polyfill for process in browser (for simple-peer and other node modules)
// This must run before any imports that might depend on process

if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
    // Minimal robust polyfill with required PUBLIC_URL, cast as any to satisfy TS
    (window as any).process = {
        env: {
            NODE_ENV: 'development',
            PUBLIC_URL: ''
        }
    };
}

// Add process.nextTick polyfill for simple-peer compatibility
if (typeof (window as any).process !== 'undefined' && !(window as any).process.nextTick) {
    (window as any).process.nextTick = function (cb: () => void) {
        Promise.resolve().then(cb);
    };
}

// Fallback for direct process access
if (typeof process !== 'undefined' && !process.nextTick) {
    (process as any).nextTick = function (cb: () => void) {
        Promise.resolve().then(cb);
    };
}

// Empty export to make this a module (required for --isolatedModules)
export { };
