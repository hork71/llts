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
    this.registerNames.forEach(name => {
      console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(4, '0')}`);
    });
    console.log();
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

  // fetch naam gereserveerd, vandaar obtain
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


  execute(instruction: number) {
    switch (instruction) {
      // Move literal into the r1 register
      case instructions.MOV_LIT_R1: {
        const literal = this.obtain16();
        this.setRegister('r1', literal)
        return;
      }

      // Move literal into the r2 register
      case instructions.MOV_LIT_R2: {
        const literal = this.obtain16();
        this.setRegister('r2', literal)
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
