export declare type State = string[];
export declare type InternalTransition = null;
export declare type Transition = State | InternalTransition;
export declare type Action = (...payload: unknown[]) => Transition;
export interface Rules {
    [state: string]: {
        onEntry?: Action;
        onExit?: Action;
        actions: {
            [action: string]: Action;
        };
        states?: Rules;
    };
}
export interface Machine {
    _current: Rules;
    _latest_transition: State;
    states: Rules;
    _transition: (state: State) => void;
    emit: (action: string, ...payload: unknown[]) => void;
    peek: () => State;
}
export declare type MachineCtor = {
    new (rules: Rules, initial_state: State): Machine;
};
export declare const Machine: MachineCtor;
