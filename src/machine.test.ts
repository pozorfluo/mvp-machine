//---------------------------------------------------------------------- machine
/**
 * mvp-machine
 */
import { Machine, Rules } from './machine';
//------------------------------------------------------------------------------
describe('Machine', () => {
  let rules: Rules;
  const effect = jest.fn();
  const on_reset = jest.fn();
  const on_entry = jest.fn();
  const on_exit = jest.fn();
  let machine: Machine;
  rules = {
    id: 'top',
    initial: 'a',
    on: {
      reset: {
        target: '#top',
        actions: on_reset,
      },
    },
    states: {
      a: {
        initial: 'aa',
        on: {
          doThis: {
            target: 'b',
            actions: effect,
          },
        },
        states: {
          aa: {
            on: {
              next: {
                target: 'ab',
                actions: effect,
              },
            },
          },
          ab: {
            on: {
              back: {
                target: '#top.a',
                actions: effect,
              },
            },
          },
        },
      },
      b: {
        on: {
          doThis: {
            target: '#top.a',
            actions: effect,
          },
        },
      },
    },
  };
  


  //   beforeEach(() => {
  // rules = {
  //   a: {
  //     on: {
  //       doThis(withThat) {
  //         effect(withThat);
  //         return ['b'];
  //       },
  //       transitionToInvalid() {
  //         effect();
  //         return ['invalid'];
  //       },
  //       transitionToNestedInvalid() {
  //         effect();
  //         return ['b', 'invalid'];
  //       },
  //       doWithArgs(first, second, third) {
  //         effect(first, second, third);
  //         return null;
  //       },
  //       doWithArgsAndDefaultValue(first, second, third = 'IamOptional') {
  //         effect(first, second, third);
  //         return null;
  //       },
  //       toB() {
  //         effect();
  //         return ['b'];
  //       },
  //     },
  //   },
  //   b: {
  //     on: {
  //       toA() {
  //         effect();
  //         return ['a'];
  //       },
  //       goDown() {
  //         effect();
  //         return ['b', 'nested_b_1'];
  //       },
  //     },
  //     states: {
  //       nested_b_1: {
  //         entry() {
  //           on_entry();
  //           return null;
  //         },
  //         exit() {
  //           on_exit();
  //           return null;
  //         },
  //         on: {
  //           next() {
  //             effect();
  //             return ['b', 'nested_b_2'];
  //           },
  //           goUp() {
  //             effect();
  //             return ['b'];
  //           },
  //           stay() {
  //             effect();
  //             return null;
  //           },
  //           self() {
  //             effect();
  //             return ['b', 'nested_b_1'];
  //           },
  //         },
  //       },
  //       nested_b_2: {
  //         entry() {
  //           on_entry();
  //           return ['b', 'nested_b_3'];
  //         },
  //         on: {},
  //       },
  //       nested_b_3: {
  //         exit() {
  //           on_exit();
  //           /** @note Used to check that onExit return value  is ignored */
  //           return ['a'];
  //         },
  //         on: {
  //           goUp() {
  //             effect();
  //             return ['b'];
  //           },
  //           goDown() {
  //             effect();
  //             return ['b', 'nested_b_3', 'nested_b_3_sub'];
  //           },
  //         },
  //         states: {
  //           nested_b_3_sub: {
  //             on: {
  //               goUp() {
  //                 effect();
  //                 return ['b', 'nested_b_3'];
  //               },
  //               toB() {
  //                 effect();
  //                 return ['b'];
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   },
  // };
  //     machine = new Machine(rules, ['a']);
  //     effect.mockClear();
  //     on_entry.mockClear();
  //     on_exit.mockClear();
  //   });
  //   //----------------------------------------------------------------------------
  //   it('throws if its constructor is not called with new', () => {
  //     expect(() => {
  //       (Machine as any)();
  //     }).toThrow();
  //   });
  //   //----------------------------------------------------------------------------
  //   it('throws if its constructor is called with an invalid initial state', () => {
  //     expect(() => {
  //       new Machine(rules, ['invalid']);
  //     }).toThrow();
  //   });
  //   //----------------------------------------------------------------------------
  //   // it('throws when trying to change its rules after creation', () => {
  //   //   expect(() => {
  //   //     machine.states.a.actions.doThis = () => ['test_state'];
  //   //   }).toThrow();
  //   // });
  //   //----------------------------------------------------------------------------
  //   it('can return its current state', () => {
  //     expect(machine.peek()).toEqual(['a']);
  //   });
  //   //----------------------------------------------------------------------------
  //   it('can create a Machine that does nothing', () => {
  //     const empty_machine = new Machine({ empty_rule: { on: {} } }, [
  //       'empty_rule',
  //     ]);
  //     expect(empty_machine.peek()).toEqual(['empty_rule']);
  //   });
  //   //----------------------------------------------------------------------------
  //   it('can have its emit method safely passed as a callback', (done) => {
  //     const emit_from_another_context = machine.emit;
  //     emit_from_another_context('doThis', 'expected');
  //     expect(machine.peek()).toEqual(['b']);

  //     setTimeout(machine.emit, 0, 'toA');
  //     setTimeout(() => {
  //       done();
  //       expect(machine.peek()).toEqual(['a']);
  //     }, 0);
  //   });
  //   //----------------------------------------------------------------------------
  //   describe('Action', () => {
  //     it('can execute actions passing along given payload', () => {
  //       const payload = 'string arg';
  //       machine.emit('doThis', payload);
  //       expect(effect).toHaveBeenCalledWith(payload);
  //     });
  //     //--------------------------------------------------------------------------
  //     it('throws if given payload does not match action required number of arguments', () => {
  //       expect(() => {
  //         machine.emit('doThis');
  //       }).toThrow();
  //       expect(() => {
  //         machine.emit('doThis', 'expected', 'extraneous');
  //       }).toThrow();
  //       expect(() => {
  //         machine.emit('doWithArgs', 'expected', 'expected');
  //       }).toThrow();
  //     });
  //     //--------------------------------------------------------------------------
  //     it('allows optional action arguments using default values', () => {
  //       const payload = ['expected', 'expected'];
  //       expect(() => {
  //         machine.emit('doWithArgs', ...payload);
  //       }).toThrow();
  //       expect(() => {
  //         machine.emit('doWithArgsAndDefaultValue', ...payload);
  //       }).not.toThrow();
  //       expect(effect).toHaveBeenCalledWith(...payload, 'IamOptional');
  //     });
  //     //--------------------------------------------------------------------------
  //     it('does nothing and stay in the same state for undefined actions', () => {
  //       machine.emit('invalid_action');
  //       expect(effect).toHaveBeenCalledTimes(0);
  //       expect(machine.peek()).toEqual(['a']);
  //     });
  //   });
  //   //----------------------------------------------------------------------------
  //   describe('Transition', () => {
  //     //--------------------------------------------------------------------------
  //     it('throws when trying to transition to an invalid state', () => {
  //       expect(() => {
  //         machine.emit('transitionToInvalid');
  //       }).toThrow();
  //       expect(() => {
  //         machine.emit('transitionToNestedInvalid');
  //       }).toThrow();
  //     });
  //     //--------------------------------------------------------------------------
  //     it('can transition as specified by an action return value', () => {
  //       machine.emit('doThis', 'expected');
  //       expect(machine.peek()).toEqual(['b']);
  //     });
  //     //--------------------------------------------------------------------------
  //     it('triggers onEntry, if it exists, when entering a state', () => {
  //       machine.emit('toB');
  //       machine.emit('goDown');
  //       expect(effect).toHaveBeenCalledTimes(2);
  //       expect(on_entry).toHaveBeenCalledTimes(1);
  //     });
  //     //--------------------------------------------------------------------------
  //     it('triggers onExit, if it exists, when exiting a state', () => {
  //       machine.emit('toB');
  //       machine.emit('goDown');
  //       machine.emit('goUp');
  //       expect(effect).toHaveBeenCalledTimes(3);
  //       expect(on_entry).toHaveBeenCalledTimes(1);
  //       expect(on_exit).toHaveBeenCalledTimes(1);
  //     });
  //     //--------------------------------------------------------------------------
  //     it('can do internal transitions to same state that do not trigger onEntry, onExit', () => {
  //       machine.emit('toB');
  //       machine.emit('goDown');

  //       expect(effect).toHaveBeenCalledTimes(2);
  //       expect(on_entry).toHaveBeenCalledTimes(1);
  //       expect(on_exit).toHaveBeenCalledTimes(0);

  //       machine.emit('stay');
  //       expect(machine.peek()).toEqual(['b', 'nested_b_1']);
  //       expect(effect).toHaveBeenCalledTimes(3);
  //       expect(on_entry).toHaveBeenCalledTimes(1);
  //       expect(on_exit).toHaveBeenCalledTimes(0);
  //     });
  //     //--------------------------------------------------------------------------
  //     it('can do self transitions to same state that trigger onEntry, onExit', () => {
  //       machine.emit('toB');
  //       machine.emit('goDown');

  //       expect(effect).toHaveBeenCalledTimes(2);
  //       expect(on_entry).toHaveBeenCalledTimes(1);
  //       expect(on_exit).toHaveBeenCalledTimes(0);

  //       machine.emit('self');
  //       expect(machine.peek()).toEqual(['b', 'nested_b_1']);
  //       expect(effect).toHaveBeenCalledTimes(3);
  //       expect(on_entry).toHaveBeenCalledTimes(2);
  //       expect(on_exit).toHaveBeenCalledTimes(1);
  //     });
  //     //--------------------------------------------------------------------------
  //     it('can automatically transition when entering a state', () => {
  //       machine.emit('toB');
  //       machine.emit('goDown');
  //       machine.emit('next');
  //       expect(machine.peek()).toEqual(['b', 'nested_b_3']);
  //     });
  //     //--------------------------------------------------------------------------
  //     it('can navigate between layers of compound states', () => {
  //       machine.emit('toB');
  //       machine.emit('goDown');
  //       machine.emit('next');
  //       machine.emit('goDown');
  //       expect(machine.peek()).toEqual(['b', 'nested_b_3', 'nested_b_3_sub']);
  //       machine.emit('goUp');
  //       expect(machine.peek()).toEqual(['b', 'nested_b_3']);
  //       machine.emit('goDown');
  //       expect(machine.peek()).toEqual(['b', 'nested_b_3', 'nested_b_3_sub']);
  //       machine.emit('toB');
  //       expect(machine.peek()).toEqual(['b']);
  //     });
  //   });
});
