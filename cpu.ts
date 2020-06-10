import { createMemory } from './create-memory.ts';
import { Instructions as instructions } from './instructions.ts';

export class CPU {
  memory: DataView;
  registerNames: Array<string>;
  registers: DataView;
  registerMap: Record<string, any>;

  constructor(memory: DataView) {
    this.memory = memory;

    this.registerNames = [
      'ip', 'acc',
      'r1', 'r2', 'r3', 'r4',
      'r5', 'r6', 'r7', 'r8'
    ];

    this.registers = createMemory(this.registerNames.length * 2);

    this.registerMap = this.registerNames.reduce((map: Record<string, any>, name: string, i: number): Object => {
      map[name] = i * 2;
      return map;
    }, {});
  }

  debug(): void {
    this.registerNames.forEach((name: string) => {
      console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(4, '0')}`);
    });
    console.log();
  }

  viewMemoryAt(address: number): void {
    const nextEightBytes: Array<string> = Array.from({length: 8}, (_, i) => 
      this.memory.getUint8(address + i) 
    ).map(v => `0x${v.toString(16).padStart(2, '0')}`);

    console.log(`0x${address.toString(16).padStart(4, '0')}: ${nextEightBytes.join(' ')}`);
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


  execute(instruction: number): void {
    switch (instruction) {
      // Move literal into into register
      case instructions.MOV_LIT_REG: {
        const literal: number = this.obtain16();
        const register: number = (this.obtain() % this.registerNames.length) * 2;
        this.registers.setUint16(register, literal);
        return;
      }

      // Move register to register
      case instructions.MOV_REG_REG: {
        const registerFrom: number = (this.obtain() % this.registerNames.length) * 2;
        const registerTo: number = (this.obtain() % this.registerNames.length) * 2;
        const value: number = this.registers.getUint16(registerFrom);
        this.registers.setUint16(registerTo, value);
        return;
      }

      // Move register to memory
      case instructions.MOV_REG_MEM: {
        const registerFrom: number = (this.obtain() % this.registerNames.length) * 2;
        const address: number = this.obtain16();
        const value: number = this.registers.getUint16(registerFrom);
        this.memory.setUint16(address, value);
        return;
      }

      // Move memory to register
      case instructions.MOV_MEM_REG: {
        const address: number = this.obtain16();
        const registerTo: number = (this.obtain() % this.registerNames.length) * 2;
        const value: number = this.memory.getUint16(address);
        this.registers.setUint16(registerTo, value);
        return;
      }

      // Add register to register
      case instructions.ADD_REG_REG: {
        const r1 = this.obtain();
        const r2 = this.obtain();
        const registerValue1 = this.registers.getUint16(r1 * 2);
        const registerValue2 = this.registers.getUint16(r2 * 2);
        this.setRegister('acc', registerValue1 + registerValue2);
        return;
      }
    }
  }

  step(): void {
    const instruction = this.obtain();
    return this.execute(instruction);
  }
}
