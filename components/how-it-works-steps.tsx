interface HowItWorksStepsProps {
  steps: Array<{
    number: number
    title: string
    description: string
  }>
}

export function HowItWorksSteps({ steps }: HowItWorksStepsProps) {
  return (
    <div className="bg-[#F3DCD4] rounded-3xl p-6">
      <h3 className="text-lg font-bold text-[#24151A] mb-4">How it works</h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#7B1234] flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">{step.number}</span>
            </div>
            <div>
              <h4 className="font-semibold text-[#24151A] mb-1">{step.title}</h4>
              <p className="text-sm text-[#5A382A]">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
