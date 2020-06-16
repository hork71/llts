import { createMemory } from './create-memory.ts';
import { Instructions as instructions } from './instructions.ts';

export class CPU {
  private registerNames: Array<string>;
  private registers: DataView;
  private registerMap: Record<string, any>;
  private stackFrameSize: number;

  constructor(private memory: DataView) {
    this.memory = memory;

    this.registerNames = [
      'ip', 'acc',
      'r1', 'r2', 'r3', 'r4',
      'r5', 'r6', 'r7', 'r8',
      'sp', 'fp'
    ];

    this.registers = createMemory(this.registerNames.length * 2);

    this.registerMap = this.registerNames.reduce((map: Record<string, any>, name: string, i: number): Object => {
      map[name] = i * 2;
      return map;
    }, {});

    this.setRegister('sp', memory.byteLength - 1 - 1);
    this.setRegister('fp', memory.byteLength - 1 - 1);

    this.stackFrameSize = 0;
  }

  debug(): void {
    this.registerNames.forEach((name: string) => {
      console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(4, '0')}`);
    });
    console.log();
  }

  viewMemoryAt(address: number, n: number = 8): void {
    const nextNBytes: Array<string> = Array.from({length: n}, (_, i) => 
      this.memory.getUint8(address + i) 
    ).map(v => `0x${v.toString(16).padStart(2, '0')}`);

    console.log(`0x${address.toString(16).padStart(4, '0')}: ${nextNBytes.join(' ')}`);
  }

  getRegister(name: string): number {
    if (!(name in this.registerMap)) {
      throw new Error(`getRegister: No such register '${name}'`);
    }
    return this.registers.getUint16(this.registerMap[name]);
  }

  setRegister(name: string, value: number): void {
    if (!(name in this.registerMap)) {
      throw new Error(`setRegister: No such register '${name}'`);
    }
    return this.registers.setUint16(this.registerMap[name], value);
  }

  // fetch' is a reserved word in deno
  obtain(): number {
    const nextInstructionAddress: number = this.getRegister('ip');
    const instruction: number = this.memory.getUint8(nextInstructionAddress);
    this.setRegister('ip', nextInstructionAddress + 1);
    return instruction;
  }

  obtain16(): number {
    const nextInstructionAddress: number = this.getRegister('ip');
    const instruction: number = this.memory.getUint16(nextInstructionAddress);
    this.setRegister('ip', nextInstructionAddress + 2);
    return instruction;
  }


  push(value: number): void {
    const spAddress = this.getRegister('sp');
    this.memory.setUint16(spAddress, value);
    this.setRegister('sp', spAddress - 2);
    this.stackFrameSize += 2;
  }

  pop(): number {
    const nextSpAddress: number = this.getRegister('sp') + 2;
    this.setRegister('sp', nextSpAddress);
    this.stackFrameSize -= 2;
    return this.memory.getUint16(nextSpAddress);
  }

  pushState(): void {
    this.push(this.getRegister('r1'));
    this.push(this.getRegister('r2'));
    this.push(this.getRegister('r3'));
    this.push(this.getRegister('r4'));
    this.push(this.getRegister('r5'));
    this.push(this.getRegister('r6'));
    this.push(this.getRegister('r7'));
    this.push(this.getRegister('r8'));
    this.push(this.getRegister('ip'));
    this.push(this.stackFrameSize + 2);

    this.setRegister('fp', this.getRegister('sp'));
    this.stackFrameSize = 0;
  }

  popState(): void {
    const framePointerAddress: number = this.getRegister('fp');
    this.setRegister('sp', framePointerAddress);

    this.stackFrameSize = this.pop();
    const stackFrameSize = this.stackFrameSize;

    this.setRegister('ip', this.pop());
    this.setRegister('r8', this.pop());
    this.setRegister('r7', this.pop());
    this.setRegister('r6', this.pop());
    this.setRegister('r5', this.pop());
    this.setRegister('r4', this.pop());
    this.setRegister('r3', this.pop());
    this.setRegister('r2', this.pop());
    this.setRegister('r1', this.pop());

    const nArgs = this.pop();
    for (let i = 0; i < nArgs; i++) {
      this.pop();
    }

    this.setRegister('fp', framePointerAddress + stackFrameSize);
  }

  fetchRegisterIndex(): number {
    return (this.obtain() % this.registerNames.length) * 2;
  }

  execute(instruction: number): void {
    switch (instruction) {
      // Move literal into into register
      case instructions.MOV_LIT_REG: {
        const literal: number = this.obtain16();
        const register: number = this.fetchRegisterIndex();
        this.registers.setUint16(register, literal);
        return;
      }

      // Move register to register
      case instructions.MOV_REG_REG: {
        const registerFrom: number = this.fetchRegisterIndex();
        const registerTo: number = this.fetchRegisterIndex();
        const value: number = this.registers.getUint16(registerFrom);
        this.registers.setUint16(registerTo, value);
        return;
      }

      // Move register to memory
      case instructions.MOV_REG_MEM: {
        const registerFrom: number = this.fetchRegisterIndex();
        const address: number = this.obtain16();
        const value: number = this.registers.getUint16(registerFrom);
        this.memory.setUint16(address, value);
        return;
      }

      // Move memory to register
      case instructions.MOV_MEM_REG: {
        const address: number = this.obtain16();
        const registerTo: number = this.fetchRegisterIndex();
        const value: number = this.memory.getUint16(address);
        this.registers.setUint16(registerTo, value);
        return;
      }

      // Add register to register
      case instructions.ADD_REG_REG: {
        const r1: number = this.fetchRegisterIndex();
        const r2: number = this.fetchRegisterIndex();
        const registerValue1: number = this.registers.getUint16(r1 * 2);
        const registerValue2: number = this.registers.getUint16(r2 * 2);
        this.setRegister('acc', registerValue1 + registerValue2);
        return;
      }

      // Jump if not egual
      case instructions.JMP_NOT_EQ: {
        const value: number = this.obtain16();
        const address: number = this.obtain16();

        if (value !== this.getRegister('acc')) {
          this.setRegister('ip', address);
        }
        return;
      }

      // Push Literal
      case instructions.PSH_LIT: {
        const value: number = this.obtain16();
        this.push(value);
        return;
      }

      // Push Register
      case instructions.PSH_REG: {
        const registerIndex: number = this.fetchRegisterIndex();
        this.push(this.registers.getUint16(registerIndex));
        return;
      }

      // Pop
      case instructions.POP: {
        const registerIndex: number = this.fetchRegisterIndex();
        const value: number = this.pop();
        this.registers.setUint16(registerIndex, value);
        return;
      }

      // Call literal
      case instructions.CAL_LIT: {
        const address: number = this.obtain16();
        this.pushState();
        this.setRegister('ip', address);
        return;
      }

      // Call register
      case instructions.CAL_REG: {
        const registerIndex: number = this.fetchRegisterIndex();
        const address: number = this.registers.getUint16(registerIndex);
        this.pushState();
        this.setRegister('ip', address);
        return;
      }

      // Return from subroutine
      case instructions.RET: {
        this.popState();
        return;
      }
    }
  }

  step(): void {
    const instruction = this.obtain();
    return this.execute(instruction);
  }
}
