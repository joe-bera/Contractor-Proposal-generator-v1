export default function PublicProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout removes the dashboard navigation for public proposal viewing
  return <>{children}</>;
}
