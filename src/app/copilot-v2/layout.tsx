import { PageRoot } from "@mavenagi/components/apps/copilot/server";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageRoot>
      {children}
    </PageRoot>
  );
}