//---------------------------------------------------------------------- machine
/**
 * mvp-machine
 */

/**
 * Define InternalTransition.
 */
export type InternalTransition = undefined;

/**
 * Define StatePath.
 *
 * Target children nested states with a dot delimited path.
 *
 * A path starting with a # is an absolute path.
 *  e.g. :
 *    #top
 *    #top.sub.subsub
 *    (from top.sub) subsub is equivalent to #top.sub.subsub
 *
 * @note Xstate seems to consider lookup level as the state containing current
 *       state.
 *
 */
export type StatePath = string | InternalTransition;

/**
 * Define Action handlers.
 */
export type Action = (...payload: unknown[]) => void;

/**
 * Define Guard handlers.
 */
// export type Guard = (context) => boolean;

/**
 * Define Transition as either a target State or an InternalTransition.
 *
 * @notes Transition to a State will trigger onEntry, onExit special actions
 * including self-transitions where target State is the same as current State.
 *
 * @note InternalTransition is used to denote that no transition happens and
 * that the Action is executed without causing current State to change.
 */
// export type Transition = StatePath | InternalTransition;
export interface Transition {
  target?: StatePath;
  actions?: Action;
  //  cond?: Guard;
}

/**
 * Define Rules with possible states, actions of a Machine.
 */
type StateNode =
  | {
      initial: StatePath;
      states: {
        [state: string]: Rules;
      };
    }
  | { initial?: never; states?: never };
  
export type Rules = StateNode & {
  //   initial?: StatePath; //keyof Rules['states'] | undefined;
  id?: string;
  entry?: Action;
  exit?: Action;
  on: {
    [transition: string]: Transition; // | string
  };
  //   states?: {
  //     [state: string]: Rules;
  //   };
};

/**
 * Define Machine object.
 */
export interface Machine {
  /** Internal cursor */
  _current: Rules;
  /** Track State in its unrolled path form */
  _current_path: StatePath;
  states: Rules;
  _transition: (state: StatePath) => void;
  emit: (action: string, ...payload: unknown[]) => void;
  peek: () => StatePath;
  // /** Register an optional callback fired on Transition. */
  // onTransition: (event: MachineEvent) => void;
  // /** Register an optional callback fired on reaching Final state. */
  // onFinished: (event: MachineEvent) => void;
}

// /**
//  * Define Machine constructor.
//  */
// export type MachineCtor = {
//   new (rules: Rules): Machine;
// };

// /**
//  * Create a new Machine object.
//  */
// export const Machine = (function (
//   this: Machine,
//   rules: Rules,
//   initial_state: StatePath
// ): Machine {
//   if (!new.target) {
//     throw new Error('Machine() must be called with new !');
//   }

//   this.states = rules;
//   // this.states = deepFreeze(rules) as Rules;
//   /**
//    * Execute Action handler if a rule for given action name exists in current
//    * Machine State, passing along given payload as Action arguments.
//    *
//    * Transition to State returned by executed Action handler if any.
//    *
//    * @todo Consider using hasOwnProperty or not inheriting from Object to avoid
//    *       unintended match on {} prototype methods.
//    */
//   this.emit = (() => {
//     return (action: string, ...payload: unknown[]) => {
//       if (action in this._current.actions) {
//         const handler = (<any>this._current.actions)[action];
//         if (payload.length !== handler.length) {
//           throw new Error(
//             `${action} expects ${handler.length} arguments, ${payload.length} given !`
//           );
//         }
//         const target = handler.apply(this, payload);

//         if (target) {
//           this._transition(target);
//         }
//       }
//     };
//   })();
//   /** @note Bootstrap _current to a mock minimum viable rule. */
//   this._current = { init: { on: {} } };
//   this._transition(initial_state);
//   return this;
// } as any) as MachineCtor;

// /**
//  * @throws If target State does NOT exist on this Machine.
//  */
// Machine.prototype._transition = function (state: StatePath) {
//   if ('onExit' in this._current) {
//     /** Forbid automatic transition onExit by ignoring returned value. */
//     this._current.onExit();
//   }

//   let target = this;

//   const depth = state.length;
//   for (let i = 0; i < depth; i++) {
//     const s = state[i];
//     if (s in target.states) {
//       target = target.states[s];
//     } else {
//       throw new Error(
//         `${s} does not exist in ${i ? state[i - 1] : 'top level'} !`
//       );
//     }
//   }

//   this._current = target;
//   this._latest_transition = state;

//   if ('onEntry' in this._current) {
//     const automatic_transition = this._current.onEntry();
//     if (automatic_transition) {
//       this._transition(automatic_transition);
//     }
//   }
// };

// /**
//  * Return a copy of this Machine State in its unrolled string[] form.
//  *
//  * @note Use to check a Machine current State or to initialize a new Machine
//  *       with identical or compatible Rules to
//  */
// Machine.prototype.peek = function () {
//   return [...this._latest_transition];
// };
