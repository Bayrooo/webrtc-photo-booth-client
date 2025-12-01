
import "./globals.css";
export const metadata = { title: "Vintage Photo Booth Online", description: "Two-person WebRTC photo booth" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
