import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

/**
 * Chrome for the content pages (zones, about, faq, …). The immersive home
 * page lives outside this group and renders full-bleed without header/footer.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
