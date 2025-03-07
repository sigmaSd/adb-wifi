export class Adb {
  static async pair(
    { host, port, pass }: { host: string; port: number; pass: string },
  ) {
    return await new Deno.Command("adb", {
      args: ["pair", `${host}:${port}`, pass],
    }).spawn().status;
  }

  static async connect({ host, port }: { host: string; port: number }) {
    // adb connect doesn't set exit flag corectly
    // so we inspect stdout
    const output = await new Deno.Command("adb", {
      args: ["connect", `${host}:${port}`],
      stdout: "piped",
    }).output();
    return {
      success: output.success &&
        !new TextDecoder().decode(output.stdout).includes("failed"),
    };
  }
}
