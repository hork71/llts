import { readLines } from "https://deno.land/std@v0.57.0/io/bufio.ts";
import { createMemory } from './create-memory.ts';
import { CPU } from './cpu.ts';
import { Instructions as instructions } from './instructions.ts';

const IP: number = 0;
const ACC: number = 1;
const R1: number = 2;
const R2: number = 3;

async function main(): Promise<void> {
  const memory = createMemory(256*256);
  const writableBytes = new Uint8Array(memory.buffer);
  
  const cpu = new CPU(memory);

  let i: number = 0;
  
  writableBytes[i++] = instructions.MOV_MEM_REG;
  writableBytes[i++] = 0x01;
  writableBytes[i++] = 0x00; // 0x0100
  writableBytes[i++] = R1;
  
  writableBytes[i++] = instructions.MOV_LIT_REG;
  writableBytes[i++] = 0x00;
  writableBytes[i++] = 0x01; // 0x0001
  writableBytes[i++] = R2;
  
  writableBytes[i++] = instructions.ADD_REG_REG;
  writableBytes[i++] = R1;
  writableBytes[i++] = R2;
  
  writableBytes[i++] = instructions.MOV_REG_MEM;
  writableBytes[i++] = ACC;
  writableBytes[i++] = 0x01;
  writableBytes[i++] = 0x00; // 0x0100

  writableBytes[i++] = instructions.JMP_NOT_EQ;
  writableBytes[i++] = 0x00;
  writableBytes[i++] = 0x03; // 0x0003
  writableBytes[i++] = 0x00;
  writableBytes[i++] = 0x00; // 0x0000

  cpu.debug();
  cpu.viewMemoryAt(cpu.getRegister('ip'));
  cpu.viewMemoryAt(0x0100);

  for await (const line of readLines(Deno.stdin)) {
    cpu.step();
    cpu.debug();
    cpu.viewMemoryAt(cpu.getRegister('ip'));
    cpu.viewMemoryAt(0x0100);
    console.log(line);
  }
}

main();
