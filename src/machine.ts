//---------------------------------------------------------------------- machine
/**
 * # mvp-machine
 *
 * Simple, declarative-ish state machines inspired by statecharts.
 *
 * handles :
 *
 * - actions
 * - automatic transitions
 * - nested/compound states
 * - self transitions
 * - internal transitions
 * - state entry/exit events
 *
 * allows :
 *
 * - guards
 * - transient states
 * - final states
 * - raised events
 *
 * does not handle :
 *
 * - parallel states
 * - internal transitions to children compound states
 *
 * @note Footguns :
 *         - It is possible to set up infinite automatic transition loops
 */
import { deepFreeze } from './lib/deep-freeze';

/**
 * Define State of a Machine.
 */
export type State = string[];

/**
 * Define InternalTransition.
 */
export type InternalTransition = null;
/**
 * Define Transition as either a target State or an InternalTransition.
 *
 * @notes Transition to a State will trigger onEntry, onExit special actions
 * including self-transitions where target State is the same as current State.
 *
 * @note InternalTransition is used to denote that no transition happens and
 * that the Action is executed without causing current State to change.
 */
export type Transition = State | InternalTransition;

/**
 * Define Action handlers of a Machine Rules.
 *
 * After executing the Action, the Machine will transition to the returned
 * Transition value which is either a target State or a value to denote an
 * InternalTransition.
 */
export type Action = (...payload: unknown[]) => Transition;

/**
 * Define Rules with possible states, actions of a Machine.
 *
 * @note onEntry, onExit are special action automatically executed when the
 *       their parent state is entered/exited.
 *
 * @note onExit returned value is ignored to forbid automatic transitions
 *       from this special action.
 *
 *
 * @todo Check if typescript allows onEntry, onExit to be assigned a Rules type
 *       value. Hopefully not.
 * @todo Consider handling parallel states.
 * @todo Consider requiring that properties on Rules MUST be enumerable and
 *       simplifying deepFreeze().
 */
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

/**
 * Define Machine object.
 */
export interface Machine {
  /** Internal cursor */
  _current: Rules;
  /** Track State in its unrolled string[] form */
  _latest_transition: State;
  states: Rules;
  _transition: (state: State) => void;
  emit: (action: string, ...payload: unknown[]) => void;
  peek: () => State;
  // /** Register an optional callback fired on Transition. */
  // onTransition: (event: MachineEvent) => void;
  // /** Register an optional callback fired on reaching Final state. */
  // onFinished: (event: MachineEvent) => void;
}

/**
 * Define Machine constructor.
 */
export type MachineCtor = {
  new (rules: Rules, initial_state: State): Machine;
};

/**
 * Create a new Machine object.
 */
export const Machine = (function (
  this: Machine,
  rules: Rules,
  initial_state: State
): Machine {
  if (!new.target) {
    throw new Error('Machine() must be called with new !');
  }

  this.states = deepFreeze(rules) as Rules;
  /**
   * Execute Action handler if a rule for given action name exists in current
   * Machine State, passing along given payload as Action arguments.
   *
   * Transition to State returned by executed Action handler if any.
   *
   * @todo Consider using hasOwnProperty or not inheriting from Object to avoid
   *       unintended match on {} prototype methods.
   */
  this.emit = (() => {
    return (action: string, ...payload: unknown[]) => {
      if (action in this._current.actions) {
        const handler = (<any>this._current.actions)[action];
        if (payload.length !== handler.length) {
          throw new Error(
            `${action} expects ${handler.length} arguments, ${payload.length} given !`
          );
        }
        const target = handler.apply(this, payload);

        if (target) {
          this._transition(target);
        }
      }
    };
  })();
  /** @note Bootstrap _current to a mock minimum viable rule. */
  this._current = { init: { actions: {} } };
  this._transition(initial_state);
  return this;
} as any) as MachineCtor;

/**
 * @throws If target State does NOT exist on this Machine.
 */
Machine.prototype._transition = function (state: State) {
  if ('onExit' in this._current) {
    /** Forbid automatic transition onExit by ignoring returned value. */
    this._current.onExit();
  }

  let target = this;

  const depth = state.length;
  for (let i = 0; i < depth; i++) {
    const s = state[i];
    if (s in target.states) {
      target = target.states[s];
    } else {
      throw new Error(
        `${s} does not exist in ${i ? state[i - 1] : 'top level'} !`
      );
    }
  }

  this._current = target;
  this._latest_transition = state;

  if ('onEntry' in this._current) {
    const automatic_transition = this._current.onEntry();
    if (automatic_transition) {
      this._transition(automatic_transition);
    }
  }
};

/**
 * Return a copy of this Machine State in its unrolled string[] form.
 *
 * @note Use to check a Machine current State or to initialize a new Machine
 *       with identical or compatible Rules to
 */
Machine.prototype.peek = function () {
  return [...this._latest_transition];
};
