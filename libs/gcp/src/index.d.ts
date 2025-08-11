export declare function ensureTopic(): Promise<void>;
export declare function getPubSub(): {
    topic: (name: string) => {
        publishMessage: (msg: any) => Promise<string>;
    };
};
