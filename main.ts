import { browse, MulticastInterface } from "jsr:@earthstar/dns-sd";
import { DriverDeno } from "jsr:@earthstar/dns-sd/deno";
import qrcode from "npm:qrcode-terminal";

class Adb {
  static async pair(
    { host, port, pass }: { host: string; port: number; pass: string },
  ) {
    const status = await new Deno.Command("adb", {
      args: ["pair", `${host}:${port}`, pass],
    }).spawn().status;
    if (!status.success) {
      throw new Error(`ADB pair failed: ${status.code}`);
    }
    return status;
  }

  static async connect({ host, port }: { host: string; port: number }) {
    const status = await new Deno.Command("adb", {
      args: ["connect", `${host}:${port}`],
    }).spawn().status;
    if (!status.success) {
      throw new Error(`ADB connect failed: ${status.code}`);
    }
    return status;
  }
}

function showQr({ name, pass }: { name: string; pass: string }) {
  qrcode.generate(`WIFI:T:ADB;S:${name};P:${pass};;`);
}

async function startDiscovery({ pass }: { pass: string }) {
  console.log("Starting concurrent discovery...");

  const pairingBrowser = browse({
    multicastInterface: new MulticastInterface(new DriverDeno("IPv4")),
    service: {
      protocol: "tcp",
      type: "adb-tls-pairing",
    },
  });

  const connectBrowser = browse({
    multicastInterface: new MulticastInterface(new DriverDeno("IPv4")),
    service: {
      protocol: "tcp",
      type: "adb-tls-connect",
    },
  });

  // deno-lint-ignore no-explicit-any
  const handlePairingService = async (service: any) => {
    if (service.isActive) {
      console.log(
        `📡 ${service.name} - ${service.host}:${service.port} (Pairing)`,
      );
      console.log(`Pairing with ${service.host}:${service.port}`);
      try {
        const status = await Adb.pair({
          host: service.host,
          port: service.port,
          pass,
        });
        if (status.success) {
          console.log("Pairing successful.");
        }
      } catch (error) {
        console.error("Pairing failed:", error);
      }
    }
  };
  // deno-lint-ignore no-explicit-any
  const handleConnectService = async (service: any) => {
    if (service.isActive) {
      console.log(
        `📡 ${service.name} - ${service.host}:${service.port} (Connect)`,
      );
      console.log(`Connecting to ${service.host}:${service.port}`);
      try {
        const status = await Adb.connect({
          host: service.host,
          port: service.port,
        });
        if (status.success) {
          console.log("Connection successful!");
        }
      } catch (err) {
        console.error("Connection failed:", err);
      }
    }
  };

  // Use Promise.all to handle both streams concurrently
  await Promise.all([
    (async () => {
      for await (const service of pairingBrowser) {
        await handlePairingService(service);
      }
    })(),
    (async () => {
      for await (const service of connectBrowser) {
        await handleConnectService(service);
      }
    })(),
  ]);
  console.log("Discovery finished.");
}

if (import.meta.main) {
  const name = "debug";
  const pass = "123456";

  showQr({ name, pass });
  startDiscovery({ pass });
}
