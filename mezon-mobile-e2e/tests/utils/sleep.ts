export async function sleep(timeoutInMilliSeconds: number): Promise<"timeout"> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("timeout");
    }, timeoutInMilliSeconds);
  });
}
