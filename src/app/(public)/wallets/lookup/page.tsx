import { redirect } from "next/navigation";

export default async function WalletLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const { address } = await searchParams;
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    redirect("/wallets");
  }
  redirect(`/wallets/${address}`);
}
