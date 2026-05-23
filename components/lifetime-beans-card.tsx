interface LifetimeBeansCardProps {
  lifetimeBeans: number
  status: string
}

export function LifetimeBeansCard({ lifetimeBeans, status }: LifetimeBeansCardProps) {
  return (
    <div className="bg-[#F3DCD4] rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#5A382A] mb-1">Lifetime Beans</p>
          <p className="text-3xl font-bold text-[#24151A]">{lifetimeBeans}</p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#7B1234]">
            <span className="text-xs font-semibold text-white">{status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
