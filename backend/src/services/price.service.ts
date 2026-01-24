import axios from "axios";
import prisma from "../helpers/prisma";
import { removeString } from "../helpers/redis";

class PriceService {
  private readonly apiUrl = "https://api.coingecko.com/api/v3/simple/price";
  private readonly coinIds = ["solana", "the-open-network"];
  private readonly vsCurrency = "usd";
  private intervalId?: NodeJS.Timeout;

  public async fetchPrice(): Promise<void> {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          ids: this.coinIds.join(","),
          vs_currencies: this.vsCurrency,
        },
      });

      const prices = response.data;
      const solanaPrice = prices["solana"][this.vsCurrency];
      const tonPrice = prices["the-open-network"][this.vsCurrency];
      // Update both assets concurrently
      // await Promise.all([
      //   prisma.asset.update({
      //     where: { short: "SOL" },
      //     data: { price: solanaPrice },
      //   }),

      //   prisma.asset.update({
      //     where: { short: "TON" },
      //     data: { price: tonPrice },
      //   }),
      // ]);
      await removeString(`assets`);
    } catch (error) {
      console.error("Failed to fetch prices", error);
    }
  }

  public start(intervalInMinutes: number = 30): void {
    this.fetchPrice();
    this.intervalId = setInterval(
      () => this.fetchPrice(),
      intervalInMinutes * 60 * 1000
    );
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log("Stopped price fetcher service.");
    }
  }
}

export default new PriceService();
