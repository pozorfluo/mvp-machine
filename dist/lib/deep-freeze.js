"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepFreeze = void 0;
exports.deepFreeze = function (obj) {
    const props = Object.getOwnPropertyNames(obj);
    const length = props.length;
    Object.freeze(obj);
    for (let i = 0; i < length; i++) {
        const value = obj[props[i]];
        if (value) {
            const type = typeof value;
            if ((type === 'object' || type === 'function') &&
                !Object.isFrozen(value)) {
                exports.deepFreeze(value);
            }
        }
    }
    return obj;
};
