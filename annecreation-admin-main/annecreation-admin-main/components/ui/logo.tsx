import Image from "next/image"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Image
        src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/logo.svg`}
        alt="Anne Creations Logo"
        width={64}
        height={64}
        className="rounded-full"
      />
    </div>
  )
}
