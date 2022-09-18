/* eslint-disable no-unused-vars */
export const emitObject = {
    emit: (eventName: string, args: unknown[]) => {
        return eventName;
    },
};
export const serverMock = {
    emit: (eventName: string) => {
        return eventName;
    },
    in: (roomId: string) => {
        return emitObject;
    },
    to: (roomId: string) => {
        return emitObject;
    },
};
