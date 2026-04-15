import { AccountPanel } from "@/features/account/account-panel";
import { getAccountPageData } from "@/features/account/queries";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const accountData = await getAccountPageData();

  return <AccountPanel viewer={accountData.viewer} replays={accountData.replays} />;
}
