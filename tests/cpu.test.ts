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
  const cpu = createCPU(512);

  assertEquals(cpu.getRegister('ip'), 0);
  assertEquals(cpu.getRegister('r1'), 0);
  assertEquals(cpu.getRegister('r2'), 0);
  assertEquals(cpu.getRegister('r3'), 0);
  assertEquals(cpu.getRegister('r4'), 0);
  assertEquals(cpu.getRegister('r5'), 0);
  assertEquals(cpu.getRegister('r6'), 0);
  assertEquals(cpu.getRegister('r7'), 0);
  assertEquals(cpu.getRegister('r8'), 0);
  assertEquals(cpu.getRegister('sp'), 510);
  assertEquals(cpu.getRegister('fp'), 510);
});

Deno.test("CPU.getRegister throws on non-existing register names", function (): void {
  const cpu = createCPU();

  assertThrows(function (): void {
    cpu.getRegister('Does not exist');
  });
});
