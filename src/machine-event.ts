//---------------------------------------------------------------- machine-event
/**
 * mvp-machine
 * 
 * @todo Consider implementing a ctor helper for MachineEvent, leaving it to
 *       the user to build a MachineEvent and uses as he sees fit.
 */
import { Action, Transition, State } from './machine';
/**
 * Define MachineEvent object.
 *
 * @todo Consider how to log side-effects, especially non-deterministic ones.
 * @todo Consider that if the callback needs a timestamp it can generate one by
 *       itself.
 * @todo Consider using actionHandler.name if the action string name is
 *       enough.
 */
export interface MachineEvent {
  action: Action;
  payload: unknown[];
  transition: Transition;
  before: State;
  after: State;
  side_effects: unknown[];
}
