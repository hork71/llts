import { assertEquals } from "https://deno.land/std@v0.57.0/testing/asserts.ts";
import { createMemory } from '../create-memory.ts';

const memory = createMemory(256);

Deno.test('Creates memory succesfully', function (): void {
  assertEquals(memory.byteLength, 256);
  assertEquals(memory.byteOffset, 0);
});

//Deno.test({
//  name: "createMemory",
//  fn(): void {
//    assertEquals(memory.byteLength, 256);
//    assertEquals(memory.byteOffset, 0);
//  },
//});
