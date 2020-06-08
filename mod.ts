import { readLines } from "https://deno.land/std@v0.53.0/io/bufio.ts";
import { createMemory } from './create-memory.ts';
import { CPU } from './cpu.ts';
import { Instructions as instructions } from './instructions.ts';

async function main(): Promise<void> {
  const memory = createMemory(256);
  const writableBytes = new Uint8Array(memory.buffer);
  
  const cpu = new CPU(memory);
  
  writableBytes[0] = instructions.MOV_LIT_R1;
  writableBytes[1] = 0x12; // 0x1234
  writableBytes[2] = 0x34;
  
  writableBytes[3] = instructions.MOV_LIT_R2;
  writableBytes[4] = 0xAB; // 0xABCD
  writableBytes[5] = 0xCD;
  
  writableBytes[6] = instructions.ADD_REG_REG;
  writableBytes[7] = 2; // r1 index
  writableBytes[8] = 3; // r1 index
  
  cpu.debug();

  for await (const line of readLines(Deno.stdin)) {
    cpu.step();
    cpu.debug();

  }
  
}

main();
