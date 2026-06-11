export function PageShell({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {lead ? (
        <p className="mt-3 text-base text-muted-foreground">{lead}</p>
      ) : null}
      <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed">
        {children}
      </div>
    </article>
  )
}

export function PageSection({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="flex flex-col gap-3 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}
