export function createMemory (sizeInBytes: number): DataView {
  const ab: ArrayBuffer = new ArrayBuffer(sizeInBytes);
  const dv: DataView = new DataView(ab);
  return dv;
};
