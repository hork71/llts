import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@v0.57.0/testing/asserts.ts";
import { CPU } from "../cpu.ts";
import { createMemory } from "../create-memory.ts";

const createCPU = (sizeInBytes: number = 256) => {
  const memory: DataView = createMemory(sizeInBytes);

  return new CPU(memory);
};

Deno.test("CPU.getRegister fetches existing register names", function (): void {
  const cpu = createCPU();

  assertEquals(cpu.getRegister('ip'), 0);
  assertEquals(cpu.getRegister('sp'), 254);
  assertEquals(cpu.getRegister('fp'), 254);
});

Deno.test("CPU.getRegister throws on non-existing register names", function (): void {
  const cpu = createCPU();

  assertThrows((): void => {
    cpu.getRegister('Does not exist');
  });
});
