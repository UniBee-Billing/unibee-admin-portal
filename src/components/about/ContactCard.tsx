interface ContactCardProps {
  icon: string
  alt: string
  link: string
}

export const ContactCard = ({ link, icon, alt }: ContactCardProps) => (
  <a href={link}>
    <div className="mx-2 flex h-12 w-12 items-center justify-center rounded-xl p-2 shadow-md">
      <img alt={alt} src={`https://cdn.simpleicons.org/${icon}`} />
    </div>
  </a>
)
