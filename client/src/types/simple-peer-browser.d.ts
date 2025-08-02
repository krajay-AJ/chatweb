// Type declarations for simple-peer browser build
declare module 'simple-peer/simplepeer.min.js' {
    import { Instance } from 'simple-peer';

    interface SimplePeerConstructor {
        new(opts?: any): Instance;
        WEBRTC_SUPPORT: boolean;
    }

    const Peer: SimplePeerConstructor;
    export = Peer;
}
