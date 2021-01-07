//---------------------------------------------------------------------- machine
/**
 * # mvp-machine
 *
 * Simple, declarative-ish state machines inspired by statecharts.
 *
 * handles :
 *
 * - actions
 * - nested/compound states
 * - self transitions
 * - internal transitions
 * - state entry/exit events
 *
 * does not handle :
 *
 * - parallel states
 * - internal transitions to children compound states
 *
 * @note Footguns :
 *         - It is possible to set up infinite automatic transition loops
 */

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
 * including on self-transitions where target State is the same as current State.
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
 */

type StateNode =
  | {
      initial: State;
      states: { [state: string]: Rules };
    }
  | { initial?: never; states?: never };

export type Rules = StateNode & {
  id?: string;
  entry?: Action;
  exit?: Action;
  on?: {
    [action: string]: Action;
  };
};

const testRule: Rules = {
  initial: ['a'],
  states: {
    a: {
      entry: () => null,
      initial: ['nestA'],
      states: {
        nestA: {
          on: {
            doA: () => ['a'],
          },
        },
      },
    },
  },
};

const testMachine: Pick<Machine, 'rules'> = {
  rules: {
    initial: ['a'],
    states: {
      a: {
        entry: () => null,
        initial: ['nestA'],
        states: {
          nestA: {
            on: {
              doA: () => ['a'],
            },
          },
        },
      },
    },
  },
};

console.log(testRule, testMachine);
/**
 * Define Machine object.
 */
export interface Machine {
  rules: Rules;
  _transition: (state: State) => State;
  _target: (state: State) => Rules;
  emit: (state: State, action: string, ...payload: unknown[]) => State;
}

/**
 * Define Machine constructor.
 */
export type MachineCtor = {
  new (rules: Rules): Machine;
};

/**
 * Create a new Machine object.
 */
export const Machine = (function (this: Machine, rules: Rules): Machine {
  if (!new.target) {
    throw new Error('Machine() must be called with new !');
  }

  this.rules = rules;
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
    return (state: State, action: string, ...payload: unknown[]) => {
      const _current = this._target(state);

      const handler = _current.on?.[action];
      if (handler) {
        if (payload.length !== handler.length) {
          throw new Error(
            `${action} expects ${handler.length} arguments, ${payload.length} given !`
          );
        }
        const target = handler.apply(this, payload);
        return target ? this._transition(target) : state;
      }
      return state;
    };
  })();

  return this;
} as any) as MachineCtor;

/**
 *
 */
Machine.prototype._target = function (this: Machine, state: State): Rules {
  let target = this.rules;

  for (let i = 0, depth = state.length; i < depth; i++) {
    const exists = target.states?.[state[i]];
    if (exists) {
      target = exists;
    } else {
      throw new Error(
        `${state[i]} does not exist in ${i ? state[i - 1] : 'top level'} !`
      );
    }
  }
  return target;
};

/**
 *
 */
Machine.prototype._transition = function (
  this: Machine,
  _current: Rules,
  state: State
): State {
  _current.exit?.();
  let target = this._target(state);
  target.entry?.();
  return target.initial ? this._transition(target.initial) : state;
};

/**
 * @todo Hook factory.
 */